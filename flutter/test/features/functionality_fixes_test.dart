import 'package:flutter_test/flutter_test.dart';
import 'package:youpeak/features/channel/model/get_channel_video_model.dart';
import 'package:youpeak/features/notifications/model/notification_model.dart' as nm;
import 'package:youpeak/features/rewards/model/get_daily_reward_model.dart';
import 'package:youpeak/features/video/model/video_details_model.dart';

void main() {
  group('Video details model', () {
    test('numbers stored as text and numeric ids do not make the page unreadable', () {
      final d = DetailsOfVideo.fromJson({
        '_id': 12345,
        'commentType': '2',
        'videoTime': '60',
        'like': 3.0,
        'userId': 1700000000000,
        'hashTag': ['a', 7, ' '],
        'subscriptionCost': '10',
        'isLike': true,
      });
      expect(d.id, '12345');
      expect(d.commentType, 2);
      expect(d.videoTime, 60);
      expect(d.like, 3);
      expect(d.userId, '1700000000000');
      expect(d.hashTag, ['a', '7']);
      expect(d.subscriptionCost, 10);
      expect(d.isLike, isTrue);
      expect(d.isDislike, isFalse);
    });
  });

  group('Your videos status label', () {
    VideosTypeWiseOfChannel v(Map<String, dynamic> extra) => VideosTypeWiseOfChannel.fromJson({'_id': 'v1', 'title': 't', ...extra});

    test('public free video has no label', () => expect(v({'visibilityType': 1, 'scheduleType': 2, 'videoPrivacyType': 1}).statusLabel, isNull));
    test('private / unlisted / paid / under review', () {
      expect(v({'visibilityType': 2, 'scheduleType': 2}).statusLabel, 'Private');
      expect(v({'visibilityType': 3, 'scheduleType': 2}).statusLabel, 'Unlisted');
      expect(v({'visibilityType': 1, 'scheduleType': 2, 'videoPrivacyType': '2'}).statusLabel, 'Paid');
      expect(v({'moderationStatus': 'pending_review'}).statusLabel, 'Under review');
    });
    test('scheduled shows its time', () {
      expect(v({'scheduleType': 1, 'scheduleTime': '2030-01-02T03:04:00.000Z'}).statusLabel, startsWith('Scheduled'));
    });
    test('views given as text still parse', () => expect(v({'views': '42'}).views, 42));
  });

  group('Daily check-in calendar from the server', () {
    test('India-time today / past flags and checked-in-today are read', () {
      final m = GetDailyRewardModel.fromJson({
        'status': true,
        'checkedInToday': true,
        'streak': 3,
        'totalCoins': 1490,
        'data': [
          {'day': 1, 'reward': 300, 'isCheckIn': true, 'date': '2026-10-05', 'isToday': false, 'isPast': true},
          {'day': 2, 'reward': '330', 'isCheckIn': false, 'date': '2026-10-06', 'isToday': true, 'isPast': false},
        ],
      });
      expect(m.checkedInToday, isTrue);
      expect(m.totalCoins, 1490);
      expect(m.data![0].isPast, isTrue);
      expect(m.data![1].isToday, isTrue);
      expect(m.data![1].reward, 330);
    });
    test('older API without the calendar leaves the flags null (device-date fallback)', () {
      final d = DailyRewardData.fromJson({'day': 1, 'reward': 300, 'isCheckIn': false});
      expect(d.isToday, isNull);
      expect(d.date, isNull);
    });
  });

  group('Notifications read state', () {
    test('isRead, type and videoType are read from the server', () {
      final n = nm.Notification.fromJson({'_id': 'n1', 'isRead': true, 'type': 'NEW_VIDEO', 'videoType': 2, 'videoId': 99});
      expect(n.isRead, isTrue);
      expect(n.type, 'NEW_VIDEO');
      expect(n.videoType, 2);
      expect(n.videoId, '99');
    });
    test('a record without isRead is unread', () => expect(nm.Notification.fromJson({'_id': 'n2'}).isRead, isFalse));
  });
}
