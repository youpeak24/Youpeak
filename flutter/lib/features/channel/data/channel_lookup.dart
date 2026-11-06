import 'package:youpeak/core/network/api_problem.dart';
import 'package:youpeak/core/network/app_api_client.dart';
import 'package:youpeak/core/settings/app_settings.dart';
import 'package:youpeak/core/storage/database/database.dart';

/// The server's answer to "does this signed-in user have a channel?".
///
/// Five outcomes the screens treat differently — a failed lookup is never
/// folded into [NoChannel], because that would send an owner to the channel
/// creation form (or let them upload into the wrong place) just because the
/// network dropped.
sealed class ChannelLookup {
  const ChannelLookup();
}

/// They own a channel; [channelId] is the one the server holds.
final class ChannelFound extends ChannelLookup {
  const ChannelFound(this.channelId, {this.name = ""});

  final String channelId;
  final String name;
}

/// The server answered and this account has no channel yet.
final class NoChannel extends ChannelLookup {
  const NoChannel();
}

/// No usable session: [expired] false means there is none on this device,
/// true means the server rejected it.
final class ChannelAuthRequired extends ChannelLookup {
  const ChannelAuthRequired({required this.expired});

  final bool expired;
}

/// The server refused this account (blocked, or not allowed).
final class ChannelDenied extends ChannelLookup {
  const ChannelDenied(this.problem);

  final ApiProblem problem;
}

/// Couldn't find out (offline, timeout, server error, unreadable reply).
final class ChannelUnavailable extends ChannelLookup {
  const ChannelUnavailable(this.problem);

  final ApiProblem problem;
}

/// Looks up the signed-in user's own channel from the server's record (not
/// the copy cached on the phone, which can be stale after an update or a
/// failed profile load). Uses the per-user API client, so an expired ID token
/// is refreshed once and retried before it is reported as a session problem.
class ChannelLookupService {
  ChannelLookupService({AppApiClient? api, String? Function()? userId, bool cache = true})
      : _api = api ?? AppApiClient(),
        _userId = userId ?? (() => Database.loginUserId),
        _cache = cache;

  final AppApiClient _api;
  final String? Function() _userId;
  final bool _cache;

  Future<ChannelLookup> lookupOwn() async {
    final uid = _userId();
    if (uid == null || uid.isEmpty) return const ChannelAuthRequired(expired: false);

    final Map<String, dynamic> json;
    try {
      json = await _api.get("client/user/profile?userId=${Uri.encodeQueryComponent(uid)}");
    } on ApiException catch (e) {
      final problem = ApiProblem.fromException(e);
      AppSettings.showLog("Channel lookup failed => ${problem.diagnostic}");
      switch (problem.kind) {
        case ApiProblemKind.noSession:
          return const ChannelAuthRequired(expired: false);
        case ApiProblemKind.sessionExpired:
          return const ChannelAuthRequired(expired: true);
        case ApiProblemKind.forbidden:
        case ApiProblemKind.blocked:
          return ChannelDenied(problem);
        default:
          return ChannelUnavailable(problem);
      }
    }

    final user = json["user"];
    if (user is! Map) return const ChannelUnavailable(ApiProblem.unreadable(httpStatus: 200));
    if (user["isBlock"] == true) {
      return const ChannelDenied(ApiProblem(ApiProblemKind.blocked, code: "USER_BLOCKED"));
    }

    final isChannel = user["isChannel"] == true;
    final channelId = (user["channelId"] ?? "").toString();
    if (isChannel && channelId.isNotEmpty) {
      if (_cache) {
        await Database.onSetIsChannel(true);
        await Database.onSetChannelId(channelId);
      }
      return ChannelFound(channelId, name: (user["fullName"] ?? "").toString());
    }
    if (_cache && user["isChannel"] == false) await Database.onSetIsChannel(false);
    return const NoChannel();
  }
}
