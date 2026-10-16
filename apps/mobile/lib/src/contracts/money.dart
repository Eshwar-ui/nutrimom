/// Money rules, mirrored from `packages/shared/src/index.ts`.
///
/// Money is **integer paise** everywhere in this product — in the database, on
/// the wire, and here. Nothing in this file returns a double, and no caller
/// should introduce one: a rupee-denominated double is how a marketplace ends
/// up owing a seller a fraction of a paisa it cannot pay.
library;

import 'package:intl/intl.dart';

/// One-time seller registration fee. Display only — the server is
/// authoritative for what is actually charged.
const int kRegistrationFeePaise = 10000; // ₹100

/// The commission split, identical to `splitPayout()` in shared.
///
/// `grossInPaise * commissionBps / 10000` is evaluated in float64 on both
/// sides — Dart's `double` and JavaScript's `number` are the same IEEE-754
/// type, so the intermediate value matches bit for bit. The rounding is then
/// written out longhand rather than using Dart's `.round()`, because the two
/// languages disagree on halfway cases: JS `Math.round` rounds toward positive
/// infinity (`-2.5 → -2`) while Dart rounds away from zero (`-2.5 → -3`).
/// Gross is never negative today, so the two agree in practice — this keeps
/// them agreeing if that ever stops being true.
PayoutSplit splitPayout(int grossInPaise, int commissionBps) {
  final raw = (grossInPaise * commissionBps) / 10000;
  final commissionInPaise = (raw + 0.5).floor();
  return PayoutSplit(
    commissionInPaise: commissionInPaise,
    netInPaise: grossInPaise - commissionInPaise,
  );
}

class PayoutSplit {
  const PayoutSplit({
    required this.commissionInPaise,
    required this.netInPaise,
  });

  final int commissionInPaise;
  final int netInPaise;

  /// Always exactly the gross that went in. Asserting on this is the cheapest
  /// guard against a split that silently loses a paisa.
  int get grossInPaise => commissionInPaise + netInPaise;
}

final _inr = NumberFormat.currency(
  locale: 'en_IN',
  symbol: '₹',
  decimalDigits: 0,
);

/// `100000 → "₹1,000"`. Mirrors `formatPaise()` — Indian digit grouping,
/// no decimals.
String formatPaise(int paise) => _inr.format(paise / 100);

/// `550 → "5.5%"`, `1000 → "10%"`. Mirrors `formatBps()`.
String formatBps(int bps) {
  final pct = bps / 100;
  final fixed = pct.toStringAsFixed(2);
  final trimmed = fixed.contains('.')
      ? fixed.replaceAll(RegExp(r'0+$'), '').replaceAll(RegExp(r'\.$'), '')
      : fixed;
  return '$trimmed%';
}

/// Builds a `wa.me` deep link with a prefilled message. Mirrors
/// `whatsappLink()`, including the bare-10-digit → +91 normalisation.
String whatsappLink(String number, String message) {
  final digits = number.replaceAll(RegExp(r'[^0-9]'), '');
  final normalized = digits.length == 10 ? '91$digits' : digits;
  return 'https://wa.me/$normalized?text=${Uri.encodeComponent(message)}';
}
