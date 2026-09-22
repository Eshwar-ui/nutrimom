import 'package:flutter/material.dart';

/// The brand's design tokens, ported verbatim from the web app's
/// `apps/web/src/app/globals.css`.
///
/// Names match the CSS custom properties one-for-one (`--primary` →
/// [primary], `--accent-text` → [accentText]) so the two can be diffed by
/// eye. The web is the source of truth: if a token changes there, change it
/// here, do not re-derive it.
///
/// **Not** the palette in the founders' brief PDF (§13 names Deep Teal and
/// Sage with Playfair + DM Sans). That was the plan; the built site went
/// somewhere warmer, and the app follows what actually shipped.
@immutable
class NmTokens extends ThemeExtension<NmTokens> {
  const NmTokens({
    required this.background,
    required this.foreground,
    required this.surface,
    required this.surface2,
    required this.primary,
    required this.primaryForeground,
    required this.accent,
    required this.accentForeground,
    required this.accentText,
    required this.danger,
    required this.dangerForeground,
    required this.gold,
    required this.muted,
    required this.mutedForeground,
    required this.border,
    required this.borderControl,
    required this.ring,
    required this.blush,
    required this.lavender,
    required this.sky,
    required this.sage,
    required this.beige,
    required this.cream,
  });

  final Color background;
  final Color foreground;
  final Color surface;
  final Color surface2;

  final Color primary;
  final Color primaryForeground;

  final Color accent;
  final Color accentForeground;

  /// The readable form of the accent. Coral at full strength fails contrast as
  /// text, so the web defines a darker sibling for links and emphasis; using
  /// [accent] for text is the mistake this token exists to prevent.
  final Color accentText;

  final Color danger;
  final Color dangerForeground;
  final Color gold;

  final Color muted;
  final Color mutedForeground;
  final Color border;
  final Color borderControl;
  final Color ring;

  /// Pastel tints for category tiles and section washes. Deliberately
  /// **identical in both themes** — the web does the same, because these are
  /// used as fills behind dark ink, never as ink themselves.
  final Color blush;
  final Color lavender;
  final Color sky;
  final Color sage;
  final Color beige;
  final Color cream;

  /// `--radius-xl: 1.25rem`, `--radius-2xl: 1.75rem`, `--radius-3xl: 2.25rem`.
  static const double radiusXl = 20;
  static const double radius2xl = 28;
  static const double radius3xl = 36;

  static const light = NmTokens(
    background: Color(0xFFFDF6EE),
    foreground: Color(0xFF241C18),
    surface: Color(0xFFFFFFFF),
    surface2: Color(0xFFF6ECE0),
    primary: Color(0xFF456F50),
    primaryForeground: Color(0xFFFDF6EE),
    accent: Color(0xFFEF8377),
    accentForeground: Color(0xFF3A2318),
    accentText: Color(0xFFA94740),
    danger: Color(0xFFA43F39),
    dangerForeground: Color(0xFFFFFAF5),
    gold: Color(0xFFD8A84C),
    muted: Color(0xFFF3E9DD),
    mutedForeground: Color(0xFF75645A),
    border: Color(0xFFECDECD),
    borderControl: Color(0xFF9A8371),
    ring: Color(0xFFEF8377),
    blush: Color(0xFFF7C6D0),
    lavender: Color(0xFFD9C8F2),
    sky: Color(0xFFCFE8F9),
    sage: Color(0xFFA8C3A0),
    beige: Color(0xFFEFDCC8),
    cream: Color(0xFFFFF8F2),
  );

  static const dark = NmTokens(
    background: Color(0xFF1B1613),
    foreground: Color(0xFFF5ECE3),
    surface: Color(0xFF241D18),
    surface2: Color(0xFF2E251F),
    primary: Color(0xFF8FC79B),
    primaryForeground: Color(0xFF14100D),
    accent: Color(0xFFF4A196),
    accentForeground: Color(0xFF14100D),
    accentText: Color(0xFFFFB4AA),
    danger: Color(0xFFF28B82),
    dangerForeground: Color(0xFF1B1613),
    gold: Color(0xFFE2B768),
    muted: Color(0xFF2E251F),
    mutedForeground: Color(0xFFB3A596),
    border: Color(0xFF3A2F27),
    borderControl: Color(0xFF8C7768),
    ring: Color(0xFFF4A196),
    blush: Color(0xFFF7C6D0),
    lavender: Color(0xFFD9C8F2),
    sky: Color(0xFFCFE8F9),
    sage: Color(0xFFA8C3A0),
    beige: Color(0xFFEFDCC8),
    cream: Color(0xFFFFF8F2),
  );

  @override
  NmTokens copyWith() => this;

  @override
  NmTokens lerp(ThemeExtension<NmTokens>? other, double t) {
    if (other is! NmTokens) return this;
    // Snapped rather than interpolated: the only transition between these two
    // sets is a theme switch, and a half-lerped brand colour is not a state
    // this product ever wants to render.
    return t < 0.5 ? this : other;
  }
}

extension NmTokensX on BuildContext {
  /// The brand tokens for the current theme.
  NmTokens get tokens => Theme.of(this).extension<NmTokens>() ?? NmTokens.light;
}
