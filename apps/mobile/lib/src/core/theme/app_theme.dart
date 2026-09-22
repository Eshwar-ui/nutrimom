import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'app_tokens.dart';

/// The app's themes, built from the web's design tokens.
///
/// Both modes ship because the web defines a full dark palette; pinning the
/// app to light would make it the only surface of the brand that ignores the
/// system setting.
class AppTheme {
  const AppTheme._();

  /// `--font-display: var(--font-fraunces)` and `--font-sans: var(--font-outfit)`.
  static const _display = 'Fraunces';
  static const _sans = 'Outfit';

  static ThemeData get light => _build(NmTokens.light, Brightness.light);
  static ThemeData get dark => _build(NmTokens.dark, Brightness.dark);

  static ThemeData _build(NmTokens t, Brightness brightness) {
    final scheme = ColorScheme(
      brightness: brightness,
      primary: t.primary,
      onPrimary: t.primaryForeground,
      secondary: t.accent,
      onSecondary: t.accentForeground,
      error: t.danger,
      onError: t.dangerForeground,
      surface: t.surface,
      onSurface: t.foreground,
      onSurfaceVariant: t.mutedForeground,
      outline: t.border,
      outlineVariant: t.border,
      surfaceContainerHighest: t.muted,
      surfaceContainerHigh: t.surface2,
    );

    final text = TextTheme(
      displayLarge: const TextStyle(
        fontFamily: _display,
        fontWeight: FontWeight.w600,
        fontSize: 40,
        height: 1.08,
      ),
      displayMedium: const TextStyle(
        fontFamily: _display,
        fontWeight: FontWeight.w600,
        fontSize: 33,
        height: 1.12,
      ),
      headlineLarge: const TextStyle(
        fontFamily: _display,
        fontWeight: FontWeight.w600,
        fontSize: 28,
        height: 1.18,
      ),
      headlineMedium: const TextStyle(
        fontFamily: _display,
        fontWeight: FontWeight.w600,
        fontSize: 24,
        height: 1.22,
      ),
      headlineSmall: const TextStyle(
        fontFamily: _display,
        fontWeight: FontWeight.w600,
        fontSize: 20,
        height: 1.28,
      ),
      titleLarge: const TextStyle(
        fontFamily: _sans,
        fontWeight: FontWeight.w600,
        fontSize: 18,
      ),
      titleMedium: const TextStyle(
        fontFamily: _sans,
        fontWeight: FontWeight.w500,
        fontSize: 16,
      ),
      bodyLarge: const TextStyle(
        fontFamily: _sans,
        fontWeight: FontWeight.w400,
        fontSize: 16,
        height: 1.5,
      ),
      bodyMedium: const TextStyle(
        fontFamily: _sans,
        fontWeight: FontWeight.w400,
        fontSize: 14,
        height: 1.5,
      ),
      bodySmall: const TextStyle(
        fontFamily: _sans,
        fontWeight: FontWeight.w400,
        fontSize: 12,
        height: 1.45,
      ),
      labelLarge: const TextStyle(
        fontFamily: _sans,
        fontWeight: FontWeight.w600,
        fontSize: 14,
      ),
    ).apply(bodyColor: t.foreground, displayColor: t.foreground);

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: scheme,
      extensions: [t],
      scaffoldBackgroundColor: t.background,
      textTheme: text,
      fontFamily: _sans,
      appBarTheme: AppBarTheme(
        // Pinned rather than inferred: over the pillar art the app bar is
        // transparent, and iOS then guessed light status-bar icons, which
        // disappeared into the cream wall behind them.
        systemOverlayStyle: brightness == Brightness.light
            ? SystemUiOverlayStyle.dark
            : SystemUiOverlayStyle.light,
        backgroundColor: t.background,
        surfaceTintColor: Colors.transparent,
        foregroundColor: t.foreground,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          fontFamily: _display,
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: t.foreground,
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: t.primary,
          foregroundColor: t.primaryForeground,
          // 52 rather than Material's 40: this is a one-handed app, often used
          // while holding a baby.
          minimumSize: const Size.fromHeight(52),
          textStyle: const TextStyle(
            fontFamily: _sans,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
          shape: const StadiumBorder(),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: t.foreground,
          backgroundColor: t.surface,
          minimumSize: const Size.fromHeight(52),
          // 2px, matching the web's `border-2` on the pill controls.
          side: BorderSide(color: t.border, width: 2),
          textStyle: const TextStyle(
            fontFamily: _sans,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
          shape: const StadiumBorder(),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: t.accentText,
          textStyle: const TextStyle(
            fontFamily: _sans,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: t.surface,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 18,
          vertical: 16,
        ),
        border: _field(t.border),
        enabledBorder: _field(t.border),
        focusedBorder: _field(t.ring, width: 2),
        errorBorder: _field(t.danger),
        focusedErrorBorder: _field(t.danger, width: 2),
        labelStyle: TextStyle(color: t.mutedForeground),
        hintStyle: TextStyle(color: t.mutedForeground),
        helperStyle: TextStyle(color: t.mutedForeground),
        // Two lines, not one: in a half-width field (the checkout PIN code)
        // "Enter a valid 6-digit postal code" was cut to "Enter a valid 6-d...",
        // which drops the part that says what is wrong.
        errorMaxLines: 2,
        helperMaxLines: 2,
      ),
      cardTheme: CardThemeData(
        color: t.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(NmTokens.radius2xl),
          side: BorderSide(color: t.border, width: 2),
        ),
      ),
      dividerTheme: DividerThemeData(color: t.border, space: 1, thickness: 1),
      // Material 3 tints sheets, dialogs and chips from the seed colour, which
      // drifts away from the brand's cream. These pin them to real tokens.
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: t.surface,
        surfaceTintColor: Colors.transparent,
        modalBackgroundColor: t.surface,
        dragHandleColor: t.border,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(NmTokens.radius3xl),
          ),
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: t.surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(NmTokens.radiusXl),
        ),
        titleTextStyle: text.headlineSmall,
        contentTextStyle: text.bodyMedium?.copyWith(color: t.mutedForeground),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: t.surface,
        selectedColor: t.sage.withValues(
          alpha: brightness == Brightness.dark ? 0.32 : 0.55,
        ),
        surfaceTintColor: Colors.transparent,
        side: BorderSide(color: t.border, width: 2),
        labelStyle: text.bodyMedium?.copyWith(fontWeight: FontWeight.w500),
        showCheckmark: false,
        shape: const StadiumBorder(),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: t.foreground,
        contentTextStyle: TextStyle(fontFamily: _sans, color: t.background),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(color: t.primary),
    );
  }

  static OutlineInputBorder _field(Color color, {double width = 2}) {
    return OutlineInputBorder(
      borderRadius: BorderRadius.circular(NmTokens.radiusXl),
      borderSide: BorderSide(color: color, width: width),
    );
  }
}
