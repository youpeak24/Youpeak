import 'package:youpeak/core/network/api_problem.dart';

/// What the splash does when the signed-in user's profile didn't load.
enum SplashStart {
  /// The server definitively says this account can't continue here (gone, or
  /// no valid session): sign out and show the login screen.
  signOut,

  /// The account is blocked: say so (signing out would only hide it).
  blocked,

  /// No answer yet or no connection: keep the session and let the user retry.
  /// Signing out here would erase their local data (downloads, preferences)
  /// because of a slow network.
  retry,
}

/// Decides from why the profile call failed. [problem] is null when the call
/// hasn't answered yet (the splash stops waiting after a few seconds).
SplashStart decideSplashStart(ApiProblem? problem) {
  if (problem == null) return SplashStart.retry;
  switch (problem.kind) {
    case ApiProblemKind.notFound:
    case ApiProblemKind.noSession:
    case ApiProblemKind.sessionExpired:
      return SplashStart.signOut;
    case ApiProblemKind.blocked:
      return SplashStart.blocked;
    case ApiProblemKind.forbidden:
    case ApiProblemKind.offline:
    case ApiProblemKind.timeout:
    case ApiProblemKind.server:
    case ApiProblemKind.refused:
    case ApiProblemKind.unreadable:
      return SplashStart.retry;
  }
}
