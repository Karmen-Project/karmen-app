import 'dart:io';
import 'dart:typed_data';

import 'package:cunning_document_scanner/cunning_document_scanner.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/di/injection.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/karmen_colors_extension.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';
import '../../../auth/presentation/bloc/auth_state.dart';
import '../../domain/entities/provider.dart';
import '../bloc/facturas_bloc.dart';
import '../bloc/facturas_event.dart';
import '../bloc/facturas_state.dart';

// Wrapper que provee su propio FacturasBloc
class UploadFacturaPage extends StatelessWidget {
  const UploadFacturaPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => getIt<FacturasBloc>(),
      child: const _UploadFacturaView(),
    );
  }
}

class _UploadFacturaView extends StatefulWidget {
  const _UploadFacturaView();

  @override
  State<_UploadFacturaView> createState() => _UploadFacturaViewState();
}

class _UploadFacturaViewState extends State<_UploadFacturaView> {
  String _selectedType = AppConstants.invoiceTypeIngreso;
  Uint8List? _imageBytes;
  String _filename = 'factura.jpg';
  String? _selectedProviderId;
  final _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _loadProviders();
  }

  void _loadProviders() {
    final authState = context.read<AuthBloc>().state;
    if (authState is AuthAuthenticated) {
      context.read<FacturasBloc>().add(
            FacturasLoadRequested(companyId: authState.session.companyId),
          );
    }
  }

  Future<void> _pickImage(ImageSource source) async {
    // Usar calidad máxima para OCR, especialmente desde cámara
    final imageQuality = source == ImageSource.camera ? 100 : 85;
    final xfile = await _picker.pickImage(
      source: source,
      imageQuality: imageQuality,
      preferredCameraDevice: CameraDevice.rear,
    );
    if (xfile == null) return;
    final bytes = await xfile.readAsBytes();

    _setImageFromBytes(bytes);
  }

  Future<void> _openScanner() async {
    try {
      // Escáner nativo: detecta bordes, recorta y corrige perspectiva
      final pictures = await CunningDocumentScanner.getPictures(
            noOfPages: 1,
            isGalleryImportAllowed: false,
          ) ??
          [];
      if (pictures.isNotEmpty && mounted) {
        final bytes = await File(pictures.first).readAsBytes();
        _setImageFromBytes(bytes);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al escanear: $e')),
        );
      }
    }
  }

  void _setImageFromBytes(Uint8List bytes) {
    // Generar un nombre consistente con timestamp
    final now = DateTime.now();
    final timestamp = '${now.year}${now.month.toString().padLeft(2, '0')}${now.day.toString().padLeft(2, '0')}_${now.hour.toString().padLeft(2, '0')}${now.minute.toString().padLeft(2, '0')}${now.second.toString().padLeft(2, '0')}';

    setState(() {
      _imageBytes = bytes;
      _filename = 'factura_$timestamp.jpg';
    });
  }

  void _upload() {
    if (_imageBytes == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Selecciona una imagen primero')),
      );
      return;
    }
    final authState = context.read<AuthBloc>().state;
    if (authState is! AuthAuthenticated) return;

    context.read<FacturasBloc>().add(FacturaUploadRequested(
          companyId: authState.session.companyId,
          type: _selectedType,
          bytes: _imageBytes!,
          filename: _filename,
          providerId: _selectedProviderId,
        ));
  }

  @override
  Widget build(BuildContext context) {
    final c = context.kc;

    return BlocListener<FacturasBloc, FacturasState>(
      listener: (context, state) {
        if (state is FacturasUploadSuccess) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text('Factura procesada con OCR exitosamente',
                style: GoogleFonts.inter(fontWeight: FontWeight.w500)),
            backgroundColor: c.green,
            behavior: SnackBarBehavior.floating,
          ));
          context.go('/dashboard');
        } else if (state is FacturasError) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text(state.message),
            backgroundColor: c.red,
            behavior: SnackBarBehavior.floating,
          ));
        }
      },
      child: Scaffold(
        backgroundColor: c.bg,
        appBar: AppBar(
          title: Text('Cargar Factura',
              style: GoogleFonts.inter(
                  fontSize: 18, fontWeight: FontWeight.w700)),
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Tipo de factura
              Container(
                padding: const EdgeInsets.all(20),
                decoration: AppTheme.cardDecoration(c),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Tipo de factura',
                        style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: c.text)),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _TypeOption(
                          label: 'Ingreso',
                          icon: Icons.arrow_downward_rounded,
                          selected: _selectedType == AppConstants.invoiceTypeIngreso,
                          activeColor: c.green,
                          activeBg: c.greenLight,
                          inactiveColor: c.textSub,
                          borderColor: c.border,
                          onTap: () => setState(
                              () => _selectedType = AppConstants.invoiceTypeIngreso),
                        ),
                        const SizedBox(width: 12),
                        _TypeOption(
                          label: 'Egreso',
                          icon: Icons.arrow_upward_rounded,
                          selected: _selectedType == AppConstants.invoiceTypeEgreso,
                          activeColor: c.red,
                          activeBg: c.redLight,
                          inactiveColor: c.textSub,
                          borderColor: c.border,
                          onTap: () => setState(
                              () => _selectedType = AppConstants.invoiceTypeEgreso),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Proveedor
              BlocBuilder<FacturasBloc, FacturasState>(
                builder: (context, state) {
                  final providers =
                      state is FacturasLoaded ? state.providers : const <Provider>[];
                  return Container(
                    padding: const EdgeInsets.all(20),
                    decoration: AppTheme.cardDecoration(c),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Proveedor',
                            style: GoogleFonts.inter(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: c.text)),
                        const SizedBox(height: 12),
                        _ProviderDropdown(
                          providers: providers,
                          selectedValue: _selectedProviderId,
                          onChanged: (value) =>
                              setState(() => _selectedProviderId = value),
                          c: c,
                        ),
                      ],
                    ),
                  );
                },
              ),
              const SizedBox(height: 16),

              // Imagen
              Container(
                padding: const EdgeInsets.all(20),
                decoration: AppTheme.cardDecoration(c),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Imagen de la factura',
                        style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: c.text)),
                    const SizedBox(height: 12),
                    _ImagePreview(bytes: _imageBytes, c: c),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: _openScanner,
                            icon: const Icon(Icons.document_scanner_outlined,
                                size: 18),
                            label: Text('Escanear',
                                style: GoogleFonts.inter(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600)),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () => _pickImage(ImageSource.gallery),
                            icon: const Icon(Icons.photo_library_outlined,
                                size: 18),
                            label: Text('Galería',
                                style: GoogleFonts.inter(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600)),
                          ),
                        ),
                      ],
                    ),
                    // TODO: Descomentar cuando se implemente captura de cámara mejorada
                    // const SizedBox(height: 8),
                    // Row(
                    //   children: [
                    //     Expanded(
                    //       child: OutlinedButton.icon(
                    //         onPressed: () => _pickImage(ImageSource.camera),
                    //         icon: const Icon(Icons.camera_alt_outlined,
                    //             size: 18),
                    //         label: Text('Foto rápida',
                    //             style: GoogleFonts.inter(
                    //                 fontSize: 14,
                    //                 fontWeight: FontWeight.w600)),
                    //       ),
                    //     ),
                    //   ],
                    // ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Botón subir
              BlocBuilder<FacturasBloc, FacturasState>(
                builder: (context, state) {
                  final isLoading = state is FacturasLoading;
                  return ElevatedButton.icon(
                    onPressed: isLoading ? null : _upload,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: c.accent,
                      minimumSize: const Size(double.infinity, 48),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8)),
                    ),
                    icon: isLoading
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: Colors.white))
                        : const Icon(Icons.upload_rounded, size: 20),
                    label: Text(
                      isLoading ? 'Procesando OCR (puede tardar)...' : 'Cargar y procesar',
                      style: GoogleFonts.inter(
                          fontSize: 15, fontWeight: FontWeight.w700),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TypeOption extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final Color activeColor;
  final Color activeBg;
  final Color inactiveColor;
  final Color borderColor;
  final VoidCallback onTap;

  const _TypeOption({
    required this.label,
    required this.icon,
    required this.selected,
    required this.activeColor,
    required this.activeBg,
    required this.inactiveColor,
    required this.borderColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) => Expanded(
        child: GestureDetector(
          onTap: onTap,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            padding: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              color: selected ? activeBg : Colors.transparent,
              border: Border.all(color: selected ? activeColor : borderColor),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              children: [
                Icon(icon,
                    color: selected ? activeColor : inactiveColor, size: 20),
                const SizedBox(height: 4),
                Text(label,
                    style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: selected ? activeColor : inactiveColor)),
              ],
            ),
          ),
        ),
      );
}

class _ImagePreview extends StatelessWidget {
  final Uint8List? bytes;
  final KarmenColors c;

  const _ImagePreview({this.bytes, required this.c});

  @override
  Widget build(BuildContext context) {
    if (bytes == null) {
      return Container(
        height: 160,
        decoration: BoxDecoration(
          color: c.surfaceSecondary,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: c.border),
        ),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.image_outlined, size: 40, color: c.textMuted),
              const SizedBox(height: 8),
              Text('Sin imagen seleccionada',
                  style: GoogleFonts.inter(fontSize: 13, color: c.textMuted)),
            ],
          ),
        ),
      );
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: Image.memory(
        bytes!,
        height: 200,
        width: double.infinity,
        fit: BoxFit.cover,
      ),
    );
  }
}

class _ProviderDropdown extends StatelessWidget {
  final List<Provider> providers;
  final String? selectedValue;
  final void Function(String?) onChanged;
  final KarmenColors c;

  const _ProviderDropdown({
    required this.providers,
    required this.selectedValue,
    required this.onChanged,
    required this.c,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: c.surfaceSecondary,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: c.border),
      ),
      child: DropdownButton<String?>(
        value: selectedValue,
        hint: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Text('Usar proveedor de la factura',
              style: GoogleFonts.inter(fontSize: 14, color: c.textSub)),
        ),
        onChanged: onChanged,
        items: [
          DropdownMenuItem<String?>(
            value: null,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Text('Usar proveedor de la factura',
                  style: GoogleFonts.inter(fontSize: 14, color: c.text)),
            ),
          ),
          ...providers.map((provider) => DropdownMenuItem<String?>(
                value: provider.id,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Text(provider.name,
                      style: GoogleFonts.inter(fontSize: 14, color: c.text)),
                ),
              )),
        ],
        isExpanded: true,
        underline: const SizedBox.shrink(),
        dropdownColor: c.surface,
      ),
    );
  }
}
