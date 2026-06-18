import '../../domain/entities/session.dart';

class SessionModel extends Session {
  const SessionModel({
    required super.token,
    required super.userId,
    required super.email,
    required super.fullName,
    required super.role,
    required super.companyId,
    required super.companyName,
    required super.expiration,
  });

  factory SessionModel.fromJson(Map<String, dynamic> json) {
    final expiration = json['expiration'] != null
        ? DateTime.tryParse(json['expiration'].toString()) ??
            DateTime.now().add(const Duration(hours: 24))
        : DateTime.now().add(const Duration(hours: 24));

    return SessionModel(
      token: json['token']?.toString() ?? '',
      userId: json['userId']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      fullName: json['fullName']?.toString() ?? '',
      role: json['role']?.toString() ?? '',
      companyId: json['companyId']?.toString() ?? '',
      companyName: json['companyName']?.toString() ?? '',
      expiration: expiration,
    );
  }

  factory SessionModel.fromLoginResponse(Map<String, dynamic> json) =>
      SessionModel(
        token: json['token']?.toString() ?? '',
        userId: json['userId']?.toString() ?? '',
        email: json['email']?.toString() ?? '',
        fullName: json['fullName']?.toString() ?? '',
        role: json['role']?.toString() ?? '',
        companyId: json['companyId']?.toString() ?? '',
        companyName: json['companyName']?.toString() ?? '',
        expiration: DateTime.now().add(const Duration(hours: 24)),
      );
}
