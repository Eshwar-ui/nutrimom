import 'package:flutter_test/flutter_test.dart';
import 'package:nurture_moms/src/contracts/money.dart';

/// Mirrors `packages/shared/src/payout.spec.ts` case for case.
///
/// `splitPayout` is the single definition of how a sale divides between the
/// marketplace and the seller, and it is snapshotted onto every payout row at
/// sale time. A rounding slip here is money, silently, on every order — and
/// because this app restates the rule in a second language, the two
/// implementations have to be held to the same cases.
void main() {
  const grosses = [
    0, 1, 2, 3, 7, 99, 100, 101, 333, 999, 1000, 9999, 12345, 50000, 99900,
    100000, 123457, 999999, 10000000,
  ];
  const rates = [0, 1, 33, 100, 250, 550, 999, 1000, 3333, 5000, 9999, 10000];

  group('splitPayout', () {
    test('always splits gross exactly — commission + net == gross', () {
      for (final gross in grosses) {
        for (final bps in rates) {
          final split = splitPayout(gross, bps);
          expect(
            split.commissionInPaise + split.netInPaise,
            gross,
            reason: 'gross=$gross bps=$bps',
          );
        }
      }
    });

    test('never pays the seller more than the sale, or less than nothing', () {
      for (final gross in grosses) {
        for (final bps in rates) {
          final split = splitPayout(gross, bps);
          expect(split.netInPaise, greaterThanOrEqualTo(0));
          expect(split.netInPaise, lessThanOrEqualTo(gross));
          expect(split.commissionInPaise, greaterThanOrEqualTo(0));
          expect(split.commissionInPaise, lessThanOrEqualTo(gross));
        }
      }
    });

    test('takes nothing at 0 bps and everything at 10000 bps', () {
      final none = splitPayout(100000, 0);
      expect(none.commissionInPaise, 0);
      expect(none.netInPaise, 100000);

      final all = splitPayout(100000, 10000);
      expect(all.commissionInPaise, 100000);
      expect(all.netInPaise, 0);
    });

    test('computes the documented default: 10% of ₹1000', () {
      final split = splitPayout(100000, 1000);
      expect(split.commissionInPaise, 10000);
      expect(split.netInPaise, 90000);
    });

    test('rounds a half-paise commission the same way JavaScript does', () {
      // 1 paise at 50% is exactly 0.5. JS `Math.round` takes it up; Dart's
      // `.round()` happens to agree here, but the longhand in money.dart is
      // what guarantees it keeps agreeing.
      final one = splitPayout(1, 5000);
      expect(one.commissionInPaise, 1);
      expect(one.netInPaise, 0);

      final three = splitPayout(3, 5000);
      expect(three.commissionInPaise, 2);
      expect(three.netInPaise, 1);
    });

    test('is monotonic — a higher rate never pays the seller more', () {
      const gross = 123457;
      final sorted = [...rates]..sort();
      var previousNet = gross + 1;
      for (final bps in sorted) {
        final net = splitPayout(gross, bps).netInPaise;
        expect(net, lessThanOrEqualTo(previousNet), reason: 'bps=$bps');
        previousNet = net;
      }
    });
  });

  group('formatBps', () {
    test('matches the shared formatter', () {
      expect(formatBps(0), '0%');
      expect(formatBps(1), '0.01%');
      expect(formatBps(550), '5.5%');
      expect(formatBps(1000), '10%');
      expect(formatBps(1050), '10.5%');
      expect(formatBps(10000), '100%');
    });
  });

  group('formatPaise', () {
    test('renders rupees with Indian digit grouping and no decimals', () {
      expect(formatPaise(0), '₹0');
      expect(formatPaise(9900), '₹99');
      expect(formatPaise(100000), '₹1,000');
      // Lakh grouping, not the western thousands grouping — the same thing
      // `Intl.NumberFormat("en-IN")` produces on the web.
      expect(formatPaise(10000000), '₹1,00,000');
    });
  });

  group('whatsappLink', () {
    test('normalises a bare ten-digit number to +91', () {
      expect(
        whatsappLink('98765 43210', 'YOGA'),
        'https://wa.me/919876543210?text=YOGA',
      );
    });

    test('leaves a number that already carries a country code alone', () {
      expect(
        whatsappLink('+91 98765-43210', 'FOOD'),
        'https://wa.me/919876543210?text=FOOD',
      );
    });

    test('encodes the message exactly as encodeURIComponent does', () {
      // Dart's Uri.encodeComponent and JS's encodeURIComponent leave the same
      // set unescaped (A-Za-z0-9-_.!~*'()), so a prefilled WhatsApp message
      // composed here and one composed on the web are byte-identical. The
      // apostrophe staying raw is the part worth pinning — it is the one that
      // looks like it should be escaped and is not.
      expect(
        whatsappLink('9876543210', "SOLIDS — I'd like to book"),
        "https://wa.me/919876543210?text=SOLIDS%20%E2%80%94%20I'd%20like%20to%20book",
      );
    });
  });

  group('registration fee', () {
    test('is ₹100, matching the server-authoritative constant', () {
      expect(kRegistrationFeePaise, 10000);
    });
  });
}
