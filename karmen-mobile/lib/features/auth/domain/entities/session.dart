import 'package:equatable/equatable.dart';

class Session extends Equatable {
  final String token;
  final String userId;
  final String email;
  final String fullName;
  final String role;
  final String companyId;
  final String companyName;
  final DateTime expiration;

  const Session({
    required this.token,
    required this.userId,
    required this.email,
    required this.fullName,
    required this.role,
    required this.companyId,
    required this.companyName,
    required this.expiration,
  });

  bool get isExpired => DateTime.now().isAfter(expiration);

  Map<String, dynamic> toJson() => {
        'token': token,
        'userId': userId,
        'email': email,
        'fullName': fullName,
        'role': role,
        'companyId': companyId,
        'companyName': companyName,
        'expiration': expiration.toIso8601String(),
      };

  factory Session.fromJson(Map<String, dynamic> json) => Session(
        token: json['token'] as String,
        userId: json['userId'] as String,
        email: json['email'] as String,
        fullName: json['fullName'] as String,
        role: json['role'] as String,
        companyId: json['companyId'] as String,
        companyName: json['companyName'] as String,
        expiration: DateTime.parse(json['expiration'] as String),
      );

  @override
  List<Object> get props => [token, userId, email, role, companyId, expiration];
}
