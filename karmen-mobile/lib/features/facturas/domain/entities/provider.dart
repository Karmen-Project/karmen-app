import 'package:equatable/equatable.dart';

class Provider extends Equatable {
  final String id;
  final String name;
  final String? email;
  final String? phone;

  const Provider({
    required this.id,
    required this.name,
    this.email,
    this.phone,
  });

  @override
  List<Object?> get props => [id, name, email, phone];
}
