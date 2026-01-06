import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

enum TimeRangePreset {
  hour1(1, '1h'),
  hour6(6, '6h'),
  hour24(24, '24h'),
  day7(168, '7d'),
  custom(0, 'Custom');

  final int hours;
  final String label;

  const TimeRangePreset(this.hours, this.label);
}

class TimeRange {
  final TimeRangePreset preset;
  final DateTime? startDate;
  final DateTime? endDate;

  const TimeRange({
    required this.preset,
    this.startDate,
    this.endDate,
  });

  // Factory for preset ranges
  factory TimeRange.preset(TimeRangePreset preset) {
    return TimeRange(preset: preset);
  }

  // Factory for custom range
  factory TimeRange.custom(DateTime start, DateTime end) {
    return TimeRange(
      preset: TimeRangePreset.custom,
      startDate: start,
      endDate: end,
    );
  }

  // Default 24h range
  static TimeRange get defaultRange => TimeRange.preset(TimeRangePreset.hour24);

  int? get hours => preset != TimeRangePreset.custom ? preset.hours : null;
}

class TimeRangeFilter extends StatefulWidget {
  final TimeRange initialRange;
  final ValueChanged<TimeRange> onChanged;

  const TimeRangeFilter({
    super.key,
    required this.initialRange,
    required this.onChanged,
  });

  @override
  State<TimeRangeFilter> createState() => _TimeRangeFilterState();
}

class _TimeRangeFilterState extends State<TimeRangeFilter> {
  late TimeRangePreset _selectedPreset;
  DateTime? _customStartDate;
  DateTime? _customEndDate;
  bool _showCustomPicker = false;

  @override
  void initState() {
    super.initState();
    _selectedPreset = widget.initialRange.preset;
    _customStartDate = widget.initialRange.startDate;
    _customEndDate = widget.initialRange.endDate;
    _showCustomPicker = _selectedPreset == TimeRangePreset.custom;
  }

  void _onPresetSelected(TimeRangePreset preset) {
    setState(() {
      _selectedPreset = preset;
      _showCustomPicker = preset == TimeRangePreset.custom;
    });

    if (preset != TimeRangePreset.custom) {
      widget.onChanged(TimeRange.preset(preset));
    } else if (_customStartDate != null && _customEndDate != null) {
      widget.onChanged(TimeRange.custom(_customStartDate!, _customEndDate!));
    }
  }

  Future<void> _selectStartDate() async {
    final now = DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: _customStartDate ?? now.subtract(const Duration(days: 1)),
      firstDate: now.subtract(const Duration(days: 365)),
      lastDate: now,
    );

    if (date != null && mounted) {
      final time = await showTimePicker(
        context: context,
        initialTime: TimeOfDay.fromDateTime(_customStartDate ?? now),
      );

      if (time != null && mounted) {
        setState(() {
          _customStartDate = DateTime(
            date.year,
            date.month,
            date.day,
            time.hour,
            time.minute,
          );
        });
        _applyCustomRange();
      }
    }
  }

  Future<void> _selectEndDate() async {
    final now = DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: _customEndDate ?? now,
      firstDate: _customStartDate ?? now.subtract(const Duration(days: 365)),
      lastDate: now,
    );

    if (date != null && mounted) {
      final time = await showTimePicker(
        context: context,
        initialTime: TimeOfDay.fromDateTime(_customEndDate ?? now),
      );

      if (time != null && mounted) {
        setState(() {
          _customEndDate = DateTime(
            date.year,
            date.month,
            date.day,
            time.hour,
            time.minute,
          );
        });
        _applyCustomRange();
      }
    }
  }

  void _applyCustomRange() {
    if (_customStartDate != null && _customEndDate != null) {
      widget.onChanged(TimeRange.custom(_customStartDate!, _customEndDate!));
    }
  }

  String _formatDateTime(DateTime? dateTime) {
    if (dateTime == null) return 'Select';
    return DateFormat('MMM d, HH:mm').format(dateTime);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Preset buttons
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: TimeRangePreset.values.map((preset) {
              final isSelected = _selectedPreset == preset;
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: FilterChip(
                  label: Text(preset.label),
                  selected: isSelected,
                  onSelected: (_) => _onPresetSelected(preset),
                  selectedColor: Theme.of(context).colorScheme.primaryContainer,
                  checkmarkColor: Theme.of(context).colorScheme.primary,
                ),
              );
            }).toList(),
          ),
        ),

        // Custom date picker
        if (_showCustomPicker) ...[
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _DateTimeButton(
                  label: 'From',
                  value: _formatDateTime(_customStartDate),
                  onTap: _selectStartDate,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _DateTimeButton(
                  label: 'To',
                  value: _formatDateTime(_customEndDate),
                  onTap: _selectEndDate,
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }
}

class _DateTimeButton extends StatelessWidget {
  final String label;
  final String value;
  final VoidCallback onTap;

  const _DateTimeButton({
    required this.label,
    required this.value,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey.shade300),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                color: Colors.grey.shade600,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              value,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
