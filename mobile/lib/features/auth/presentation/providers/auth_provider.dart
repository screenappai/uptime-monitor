import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/auth_repository.dart';

class AuthState {
  final bool isAuthenticated;
  final bool isLoading;
  final String? error;
  final String? userName;

  const AuthState({
    this.isAuthenticated = false,
    this.isLoading = false,
    this.error,
    this.userName,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    bool? isLoading,
    String? error,
    String? userName,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      userName: userName ?? this.userName,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _repository;

  AuthNotifier(this._repository) : super(const AuthState());

  Future<void> checkAuthStatus() async {
    state = state.copyWith(isLoading: true);
    final isAuth = await _repository.isAuthenticated();
    final userName = await _repository.getUserName();
    state = state.copyWith(
      isAuthenticated: isAuth,
      isLoading: false,
      userName: userName,
    );
  }

  Future<bool> login(String username, String password) async {
    state = state.copyWith(isLoading: true, error: null);

    final success = await _repository.login(username, password);

    if (success) {
      final userName = await _repository.getUserName();
      state = state.copyWith(
        isAuthenticated: true,
        isLoading: false,
        userName: userName,
      );
    } else {
      state = state.copyWith(isLoading: false, error: 'Invalid credentials');
    }

    return success;
  }

  Future<Map<String, dynamic>> sendOTP(String email) async {
    state = state.copyWith(isLoading: true, error: null);

    final result = await _repository.sendOTP(email);

    if (!result['success']) {
      state = state.copyWith(isLoading: false, error: result['error']);
    } else {
      state = state.copyWith(isLoading: false);
    }

    return result;
  }

  Future<Map<String, dynamic>> verifyOTP({
    required String email,
    required String code,
    String? name,
    String? organizationName,
  }) async {
    state = state.copyWith(isLoading: true, error: null);

    final result = await _repository.verifyOTP(
      email: email,
      code: code,
      name: name,
      organizationName: organizationName,
    );

    if (result['success']) {
      final userName = await _repository.getUserName();
      state = state.copyWith(
        isAuthenticated: true,
        isLoading: false,
        userName: userName,
      );
    } else {
      state = state.copyWith(isLoading: false, error: result['error']);
    }

    return result;
  }

  Future<void> logout() async {
    state = state.copyWith(isLoading: true);
    await _repository.logout();
    state = const AuthState();
  }
}

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository();
});

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final repository = ref.watch(authRepositoryProvider);
  return AuthNotifier(repository);
});
