import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/monitors_provider.dart';
import '../widgets/status_badge.dart';
import '../widgets/time_range_filter.dart';

class MonitorDetailsScreen extends ConsumerStatefulWidget {
  final String monitorId;

  const MonitorDetailsScreen({super.key, required this.monitorId});

  @override
  ConsumerState<MonitorDetailsScreen> createState() => _MonitorDetailsScreenState();
}

class _MonitorDetailsScreenState extends ConsumerState<MonitorDetailsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  TimeRange _selectedTimeRange = TimeRange.defaultRange;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  ChecksFilterParams get _filterParams => ChecksFilterParams(
        monitorId: widget.monitorId,
        hours: _selectedTimeRange.hours,
        startDate: _selectedTimeRange.startDate,
        endDate: _selectedTimeRange.endDate,
        limit: 1000,
      );

  void _onTimeRangeChanged(TimeRange range) {
    setState(() {
      _selectedTimeRange = range;
    });
  }

  @override
  Widget build(BuildContext context) {
    final monitorAsync = ref.watch(monitorProvider(widget.monitorId));
    final statsAsync = ref.watch(monitorStatsProvider(widget.monitorId));
    final filteredChecksAsync = ref.watch(filteredMonitorChecksProvider(_filterParams));

    return Scaffold(
      appBar: AppBar(
        title: monitorAsync.when(
          data: (monitor) => Text(monitor.name),
          loading: () => const Text('Loading...'),
          error: (_, __) => const Text('Monitor'),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ref.invalidate(monitorProvider(widget.monitorId));
              ref.invalidate(monitorStatsProvider(widget.monitorId));
              ref.invalidate(filteredMonitorChecksProvider(_filterParams));
            },
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Overview'),
            Tab(text: 'Stats'),
            Tab(text: 'History'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Overview Tab
          monitorAsync.when(
            data: (monitor) => _OverviewTab(monitor: monitor),
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(child: Text('Error: $e')),
          ),

          // Stats Tab
          statsAsync.when(
            data: (stats) => _StatsTab(
              stats: stats,
              checksAsync: filteredChecksAsync,
              timeRange: _selectedTimeRange,
              onTimeRangeChanged: _onTimeRangeChanged,
            ),
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(child: Text('Error: $e')),
          ),

          // History Tab
          _HistoryTabWithFilter(
            checksAsync: filteredChecksAsync,
            timeRange: _selectedTimeRange,
            onTimeRangeChanged: _onTimeRangeChanged,
          ),
        ],
      ),
    );
  }
}

class _OverviewTab extends StatelessWidget {
  final dynamic monitor;

  const _OverviewTab({required this.monitor});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Status Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Current Status',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: Colors.grey[600],
                          ),
                        ),
                        const SizedBox(height: 8),
                        StatusBadge(status: monitor.status, large: true),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Details Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Details',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _DetailRow(label: 'URL', value: monitor.url),
                  _DetailRow(label: 'Type', value: monitor.type.toUpperCase()),
                  _DetailRow(label: 'Check Interval', value: '${monitor.interval} seconds'),
                  _DetailRow(label: 'Timeout', value: '${monitor.timeout} seconds'),
                  _DetailRow(
                    label: 'Last Check',
                    value: monitor.lastCheck != null
                        ? DateFormat('MMM d, yyyy HH:mm:ss').format(monitor.lastCheck!.toLocal())
                        : 'Never',
                  ),
                  _DetailRow(
                    label: 'Created',
                    value: DateFormat('MMM d, yyyy').format(monitor.createdAt.toLocal()),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;

  const _DetailRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: TextStyle(color: Colors.grey[600]),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatsTab extends StatelessWidget {
  final dynamic stats;
  final AsyncValue<dynamic> checksAsync;
  final TimeRange timeRange;
  final ValueChanged<TimeRange> onTimeRangeChanged;

  const _StatsTab({
    required this.stats,
    required this.checksAsync,
    required this.timeRange,
    required this.onTimeRangeChanged,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Uptime Cards
          Row(
            children: [
              _UptimeCard(label: '24h', percentage: stats.uptime24h),
              const SizedBox(width: 12),
              _UptimeCard(label: '7d', percentage: stats.uptime7d),
              const SizedBox(width: 12),
              _UptimeCard(label: '30d', percentage: stats.uptime30d),
            ],
          ),
          const SizedBox(height: 16),

          // Stats Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Statistics',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _StatRow(
                    icon: Icons.speed,
                    label: 'Avg Response Time',
                    value: '${stats.avgResponseTime.toStringAsFixed(0)}ms',
                  ),
                  _StatRow(
                    icon: Icons.check_circle,
                    label: 'Total Checks',
                    value: stats.totalChecks.toString(),
                  ),
                  _StatRow(
                    icon: Icons.done_all,
                    label: 'Successful',
                    value: stats.successfulChecks.toString(),
                    valueColor: AppTheme.successColor,
                  ),
                  _StatRow(
                    icon: Icons.error,
                    label: 'Failed',
                    value: stats.failedChecks.toString(),
                    valueColor: AppTheme.errorColor,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Time Range Filter
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Response Time Chart',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  TimeRangeFilter(
                    initialRange: timeRange,
                    onChanged: onTimeRangeChanged,
                  ),
                  const SizedBox(height: 16),
                  // Response Time Chart
                  checksAsync.when(
                    data: (checks) {
                      if (checks.isEmpty) {
                        return const SizedBox(
                          height: 200,
                          child: Center(child: Text('No data for selected time range')),
                        );
                      }
                      return SizedBox(
                        height: 200,
                        child: _ResponseTimeChart(checks: checks),
                      );
                    },
                    loading: () => const SizedBox(
                      height: 200,
                      child: Center(child: CircularProgressIndicator()),
                    ),
                    error: (e, _) => SizedBox(
                      height: 200,
                      child: Center(child: Text('Error: $e')),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _UptimeCard extends StatelessWidget {
  final String label;
  final double percentage;

  const _UptimeCard({required this.label, required this.percentage});

  @override
  Widget build(BuildContext context) {
    final color = percentage >= 99
        ? AppTheme.successColor
        : percentage >= 95
            ? AppTheme.warningColor
            : AppTheme.errorColor;

    return Expanded(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Stack(
                alignment: Alignment.center,
                children: [
                  SizedBox(
                    width: 60,
                    height: 60,
                    child: CircularProgressIndicator(
                      value: percentage / 100,
                      strokeWidth: 6,
                      backgroundColor: Colors.grey[200],
                      valueColor: AlwaysStoppedAnimation(color),
                    ),
                  ),
                  Text(
                    '${percentage.toStringAsFixed(1)}%',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                      color: color,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                label,
                style: TextStyle(color: Colors.grey[600]),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color? valueColor;

  const _StatRow({
    required this.icon,
    required this.label,
    required this.value,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, size: 20, color: Colors.grey[600]),
          const SizedBox(width: 12),
          Expanded(child: Text(label)),
          Text(
            value,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: valueColor,
            ),
          ),
        ],
      ),
    );
  }
}

class _ResponseTimeChart extends StatelessWidget {
  final List<dynamic> checks;

  const _ResponseTimeChart({required this.checks});

  @override
  Widget build(BuildContext context) {
    final spots = checks.reversed.toList().asMap().entries.map((entry) {
      return FlSpot(entry.key.toDouble(), entry.value.responseTime.toDouble());
    }).toList();

    return LineChart(
      LineChartData(
        gridData: const FlGridData(show: false),
        titlesData: const FlTitlesData(show: false),
        borderData: FlBorderData(show: false),
        lineBarsData: [
          LineChartBarData(
            spots: spots,
            isCurved: true,
            color: AppTheme.primaryColor,
            barWidth: 2,
            dotData: FlDotData(
              show: true,
              getDotPainter: (spot, percent, bar, index) {
                final check = checks.reversed.toList()[index];
                return FlDotCirclePainter(
                  radius: 3,
                  color: check.success ? AppTheme.successColor : AppTheme.errorColor,
                  strokeWidth: 0,
                );
              },
            ),
            belowBarData: BarAreaData(
              show: true,
              color: AppTheme.primaryColor.withValues(alpha: 0.1),
            ),
          ),
        ],
      ),
    );
  }
}

class _HistoryTabWithFilter extends StatelessWidget {
  final AsyncValue<dynamic> checksAsync;
  final TimeRange timeRange;
  final ValueChanged<TimeRange> onTimeRangeChanged;

  const _HistoryTabWithFilter({
    required this.checksAsync,
    required this.timeRange,
    required this.onTimeRangeChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Time Range Filter
        Padding(
          padding: const EdgeInsets.all(16),
          child: TimeRangeFilter(
            initialRange: timeRange,
            onChanged: onTimeRangeChanged,
          ),
        ),
        // Checks List
        Expanded(
          child: checksAsync.when(
            data: (checks) {
              if (checks.isEmpty) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.history, size: 64, color: Colors.grey[400]),
                      const SizedBox(height: 16),
                      Text(
                        'No check history for selected time range',
                        style: TextStyle(color: Colors.grey[600]),
                      ),
                    ],
                  ),
                );
              }

              return ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: checks.length,
                itemBuilder: (context, index) {
                  final check = checks[index];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      leading: Icon(
                        check.success ? Icons.check_circle : Icons.error,
                        color: check.success ? AppTheme.successColor : AppTheme.errorColor,
                      ),
                      title: Text(
                        '${check.responseTime}ms${check.statusCode != null ? ' - ${check.statusCode}' : ''}',
                        style: const TextStyle(fontWeight: FontWeight.w500),
                      ),
                      subtitle: Text(
                        DateFormat('MMM d, HH:mm:ss').format(check.timestamp.toLocal()),
                        style: TextStyle(color: Colors.grey[600]),
                      ),
                      trailing: check.error != null
                          ? Tooltip(
                              message: check.error!,
                              child: Icon(Icons.info_outline, color: Colors.grey[400]),
                            )
                          : null,
                    ),
                  );
                },
              );
            },
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(child: Text('Error: $e')),
          ),
        ),
      ],
    );
  }
}
