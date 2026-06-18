import 'package:equatable/equatable.dart';

class User extends Equatable {
  final String id;
  final String email;
  final String fullName;
  final String role;
  final String companyId;
  final String companyName;

  const User({
    required this.id,
    required this.email,
    required this.fullName,
    required this.role,
    required this.companyId,
    required this.companyName,
  });

  bool get isAdmin => role == 'ADMIN';

  @override
  List<Object> get props => [id, email, fullName, role, companyId, companyName];
}
