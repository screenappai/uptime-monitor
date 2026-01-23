import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../../../notifications/services/fcm_service.dart';
import '../../../monitors/presentation/providers/monitors_provider.dart';
import '../../../../core/services/server_config_service.dart';

enum LoginStep { email, otp, register }

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _otpController = TextEditingController();
  final _nameController = TextEditingController();
  final _organizationController = TextEditingController();

  LoginStep _currentStep = LoginStep.email;
  bool _isNewUser = false;
  String? _serverUrl;

  @override
  void initState() {
    super.initState();
    _loadServerUrl();
  }

  Future<void> _loadServerUrl() async {
    final url = await ServerConfigService.instance.getServerUrl();
    if (mounted) {
      setState(() {
        _serverUrl = url;
      });
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _otpController.dispose();
    _nameController.dispose();
    _organizationController.dispose();
    super.dispose();
  }

  Future<void> _sendOTP() async {
    if (!_formKey.currentState!.validate()) return;

    final result = await ref
        .read(authProvider.notifier)
        .sendOTP(_emailController.text.trim().toLowerCase());

    if (result['success'] && mounted) {
      setState(() {
        _isNewUser = result['isNewUser'] ?? false;
        _currentStep = LoginStep.otp;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message'] ?? 'OTP sent to your email'),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  Future<void> _verifyOTP() async {
    if (!_formKey.currentState!.validate()) return;

    // For new users, show registration form first
    if (_isNewUser && _currentStep == LoginStep.otp) {
      setState(() {
        _currentStep = LoginStep.register;
      });
      return;
    }

    // For existing users, verify directly
    final result = await ref
        .read(authProvider.notifier)
        .verifyOTP(
          email: _emailController.text.trim().toLowerCase(),
          code: _otpController.text.trim(),
        );

    if (result['success'] && mounted) {
      // Clear any cached monitors from previous user
      ref.invalidate(monitorsProvider);
      await FCMService.instance.registerDeviceToken();
      context.go('/monitors');
    }
  }

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;

    final result = await ref
        .read(authProvider.notifier)
        .verifyOTP(
          email: _emailController.text.trim().toLowerCase(),
          code: _otpController.text.trim(),
          name: _nameController.text.trim(),
          organizationName: _organizationController.text.trim(),
        );

    if (result['success'] && mounted) {
      // Clear any cached monitors from previous user
      ref.invalidate(monitorsProvider);
      await FCMService.instance.registerDeviceToken();
      context.go('/monitors');
    }
  }

  String _getStepTitle() {
    switch (_currentStep) {
      case LoginStep.email:
        return 'Enter your email to sign in';
      case LoginStep.otp:
        return 'Enter the code sent to your email';
      case LoginStep.register:
        return 'Create your account';
    }
  }

  String _getActionButtonText() {
    switch (_currentStep) {
      case LoginStep.email:
        return 'Send Code';
      case LoginStep.otp:
        return _isNewUser ? 'Continue' : 'Verify Code';
      case LoginStep.register:
        return 'Create Account';
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 400),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Icon(
                      Icons.monitor_heart,
                      size: 80,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'Uptime Monitor',
                      style: Theme.of(context).textTheme.headlineMedium
                          ?.copyWith(fontWeight: FontWeight.bold),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _getStepTitle(),
                      style: Theme.of(
                        context,
                      ).textTheme.bodyLarge?.copyWith(color: Colors.grey),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 48),

                    // Email Step
                    if (_currentStep == LoginStep.email) ...[
                      TextFormField(
                        controller: _emailController,
                        decoration: const InputDecoration(
                          labelText: 'Email',
                          prefixIcon: Icon(Icons.email_outlined),
                        ),
                        keyboardType: TextInputType.emailAddress,
                        textInputAction: TextInputAction.done,
                        onFieldSubmitted: (_) => _sendOTP(),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Please enter your email';
                          }
                          if (!value.contains('@')) {
                            return 'Please enter a valid email';
                          }
                          return null;
                        },
                      ),
                    ],

                    // OTP Step
                    if (_currentStep == LoginStep.otp) ...[
                      TextFormField(
                        controller: _otpController,
                        decoration: const InputDecoration(
                          labelText: 'Verification Code',
                          prefixIcon: Icon(Icons.pin_outlined),
                          hintText: 'Enter 6-digit code',
                        ),
                        keyboardType: TextInputType.number,
                        textInputAction: TextInputAction.done,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 18,
                          letterSpacing: 4,
                          fontWeight: FontWeight.w600,
                        ),
                        maxLength: 6,
                        onFieldSubmitted: (_) => _verifyOTP(),
                        onChanged: (value) {
                          // Remove non-digit characters
                          final digitsOnly = value.replaceAll(
                            RegExp(r'\D'),
                            '',
                          );
                          if (digitsOnly != value) {
                            _otpController.text = digitsOnly;
                            _otpController.selection =
                                TextSelection.fromPosition(
                                  TextPosition(offset: digitsOnly.length),
                                );
                          }
                        },
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Please enter the OTP code';
                          }
                          if (value.trim().length != 6) {
                            return 'OTP must be 6 digits';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Code sent to ${_emailController.text}',
                        style: Theme.of(
                          context,
                        ).textTheme.bodySmall?.copyWith(color: Colors.grey),
                        textAlign: TextAlign.center,
                      ),
                    ],

                    // Register Step
                    if (_currentStep == LoginStep.register) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: Colors.amber.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.amber),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Icon(
                                  Icons.info_outline,
                                  color: Colors.amber,
                                  size: 20,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'New account detected',
                                  style: Theme.of(context).textTheme.titleSmall
                                      ?.copyWith(
                                        fontWeight: FontWeight.bold,
                                        color: Colors.amber[900],
                                      ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'This will create a new organization.',
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(color: Colors.amber[900]),
                            ),
                          ],
                        ),
                      ),
                      TextFormField(
                        controller: _nameController,
                        decoration: const InputDecoration(
                          labelText: 'Your Name',
                          prefixIcon: Icon(Icons.person_outline),
                        ),
                        textInputAction: TextInputAction.next,
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Please enter your name';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _organizationController,
                        decoration: const InputDecoration(
                          labelText: 'Organization Name',
                          prefixIcon: Icon(Icons.business_outlined),
                          helperText: 'You can change this later in settings',
                        ),
                        textInputAction: TextInputAction.done,
                        onFieldSubmitted: (_) => _register(),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Please enter organization name';
                          }
                          return null;
                        },
                      ),
                    ],

                    if (authState.error != null) ...[
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.errorContainer,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.error_outline,
                              color: Theme.of(context).colorScheme.error,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                authState.error!,
                                style: TextStyle(
                                  color: Theme.of(context).colorScheme.error,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],

                    const SizedBox(height: 32),

                    // Action Button
                    SizedBox(
                      height: 50,
                      child: ElevatedButton(
                        onPressed: authState.isLoading
                            ? null
                            : () {
                                if (_currentStep == LoginStep.email) {
                                  _sendOTP();
                                } else if (_currentStep == LoginStep.otp) {
                                  _verifyOTP();
                                } else {
                                  _register();
                                }
                              },
                        child: authState.isLoading
                            ? const SizedBox(
                                height: 24,
                                width: 24,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                            : Text(_getActionButtonText()),
                      ),
                    ),

                    // Back Button
                    if (_currentStep != LoginStep.email) ...[
                      const SizedBox(height: 16),
                      TextButton(
                        onPressed: authState.isLoading
                            ? null
                            : () {
                                setState(() {
                                  if (_currentStep == LoginStep.otp) {
                                    _currentStep = LoginStep.email;
                                    _otpController.clear();
                                  } else if (_currentStep ==
                                      LoginStep.register) {
                                    _currentStep = LoginStep.email;
                                    _otpController.clear();
                                    _nameController.clear();
                                    _organizationController.clear();
                                  }
                                });
                              },
                        child: Text(
                          _currentStep == LoginStep.otp
                              ? 'Use different email'
                              : 'Start over',
                        ),
                      ),
                    ],

                    const SizedBox(height: 24),

                    // Server URL
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.grey.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            Icons.dns_outlined,
                            size: 20,
                            color: Colors.grey[600],
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _serverUrl ?? 'No server configured',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey[600],
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          TextButton(
                            onPressed: () async {
                              await context.push('/settings/server');
                              _loadServerUrl();
                            },
                            child: const Text('Change'),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
