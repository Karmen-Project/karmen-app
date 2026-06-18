import '../../domain/entities/user.dart';

class UserModel extends User {
  const UserModel({
    required super.id,
    required super.email,
    required super.fullName,
    required super.role,
    required super.companyId,
    required super.companyName,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
        id: (json['userId'] ?? json['id'])?.toString() ?? '',
        email: json['email']?.toString() ?? '',
        fullName: json['fullName']?.toString() ?? '',
        role: json['role']?.toString() ?? '',
        companyId: json['companyId']?.toString() ?? '',
        companyName: json['companyName']?.toString() ?? '',
      );
}
