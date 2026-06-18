import '../../domain/entities/provider.dart';

class ProviderModel extends Provider {
  const ProviderModel({
    required super.id,
    required super.name,
    super.email,
    super.phone,
  });

  factory ProviderModel.fromJson(Map<String, dynamic> json) => ProviderModel(
        id: json['id']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        email: json['email']?.toString(),
        phone: json['phone']?.toString(),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'phone': phone,
      };
}
