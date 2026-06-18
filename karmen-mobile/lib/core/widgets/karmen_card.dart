import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import '../theme/karmen_colors_extension.dart';

class KarmenCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final VoidCallback? onTap;

  const KarmenCard({super.key, required this.child, this.padding, this.onTap});

  @override
  Widget build(BuildContext context) {
    final c = context.kc;
    return Container(
      decoration: AppTheme.cardDecoration(c),
      child: onTap != null
          ? InkWell(
              onTap: onTap,
              borderRadius: BorderRadius.circular(12),
              child: Padding(padding: padding ?? const EdgeInsets.all(20), child: child),
            )
          : Padding(padding: padding ?? const EdgeInsets.all(20), child: child),
    );
  }
}

class KpiCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color? iconColor;
  final Color? iconBg;
  final String? sub;

  const KpiCard({
    super.key,
    required this.label,
    required this.value,
    required this.icon,
    this.iconColor,
    this.iconBg,
    this.sub,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.kc;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: AppTheme.cardDecoration(c),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label,
                  style: Theme.of(context)
                      .textTheme
                      .titleSmall
                      ?.copyWith(color: c.textSub)),
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: iconBg ?? c.accentLight,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: iconColor ?? c.accent, size: 20),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(value,
              style: Theme.of(context).textTheme.displayLarge?.copyWith(
                  fontSize: 28, fontWeight: FontWeight.w800, color: c.text)),
          if (sub != null) ...[
            const SizedBox(height: 4),
            Text(sub!,
                style: Theme.of(context)
                    .textTheme
                    .bodySmall
                    ?.copyWith(fontSize: 12, color: c.textSub)),
          ],
        ],
      ),
    );
  }
}
