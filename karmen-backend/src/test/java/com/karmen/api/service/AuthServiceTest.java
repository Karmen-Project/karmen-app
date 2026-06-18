package com.karmen.api.service;

import com.karmen.api.domain.entity.*;
import com.karmen.api.domain.repository.*;
import com.karmen.api.dto.auth.*;
import com.karmen.api.security.JwtUtils;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private CompanyRepository companyRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtils jwtUtils;

    @InjectMocks
    private AuthService authService;

    private User testUser;
    private Company testCompany;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@karmen.com");
        testUser.setPasswordHash("$2a$12$hashedpassword");
        testUser.setFullName("Test User");
        testUser.setRole("CONTADOR");

        testCompany = new Company();
        testCompany.setId(1L);
        testCompany.setName("Test Company");
        testCompany.setOwner(testUser);
    }

    @Test
    @DisplayName("login exitoso retorna token y datos de usuario")
    void login_Success_ReturnsTokenAndUserData() {
        when(userRepository.findByEmail("test@karmen.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("password123", testUser.getPasswordHash())).thenReturn(true);
        when(jwtUtils.generateToken("test@karmen.com")).thenReturn("jwt.token.here");
        when(companyRepository.findByOwnerId(1L)).thenReturn(List.of(testCompany));

        LoginResponse response = authService.login(new LoginRequest("test@karmen.com", "password123"));

        assertNotNull(response);
        assertEquals("jwt.token.here", response.token());
        assertEquals(1L, response.userId());
        assertEquals("test@karmen.com", response.email());
        assertEquals("Test User", response.fullName());
        assertEquals("CONTADOR", response.role());
        assertEquals(1L, response.companyId());
        assertEquals("Test Company", response.companyName());

        verify(userRepository).save(any(User.class)); // Actualiza lastLogin
    }

    @Test
    @DisplayName("login falla con email inexistente")
    void login_FailsWithNonExistentEmail() {
        when(userRepository.findByEmail("unknown@karmen.com")).thenReturn(Optional.empty());

        assertThrows(BadCredentialsException.class,
                () -> authService.login(new LoginRequest("unknown@karmen.com", "password123")));
    }

    @Test
    @DisplayName("login falla con contraseña incorrecta")
    void login_FailsWithWrongPassword() {
        when(userRepository.findByEmail("test@karmen.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrongpassword", testUser.getPasswordHash())).thenReturn(false);

        assertThrows(BadCredentialsException.class,
                () -> authService.login(new LoginRequest("test@karmen.com", "wrongpassword")));
    }

    @Test
    @DisplayName("register crea usuario y empresa")
    void register_CreatesUserAndCompany() {
        when(userRepository.existsByEmail("new@karmen.com")).thenReturn(false);
        when(passwordEncoder.encode("Password123!")).thenReturn("$2a$12$encodedhash");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(2L);
            return u;
        });
        when(companyRepository.save(any(Company.class))).thenAnswer(inv -> inv.getArgument(0));

        RegisterResponse response = authService.register(new RegisterRequest(
                "New User", "New Company", "newuser", "new@karmen.com", "Password123!"));

        assertNotNull(response);
        assertEquals(2L, response.id());
        assertEquals("New User", response.name());
        assertEquals("New Company", response.nameCompany());
        assertEquals("new@karmen.com", response.email());
        assertEquals("CONTADOR", response.role());

        verify(userRepository).save(any(User.class));
        verify(companyRepository).save(any(Company.class));
    }

    @Test
    @DisplayName("register falla si email ya existe")
    void register_FailsIfEmailExists() {
        when(userRepository.existsByEmail("test@karmen.com")).thenReturn(true);

        assertThrows(IllegalArgumentException.class,
                () -> authService.register(new RegisterRequest(
                        "Test User", "Test Company", "testuser", "test@karmen.com", "Password123!")));

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("login maneja usuario sin empresa")
    void login_HandlesUserWithoutCompany() {
        when(userRepository.findByEmail("test@karmen.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("password123", testUser.getPasswordHash())).thenReturn(true);
        when(jwtUtils.generateToken("test@karmen.com")).thenReturn("jwt.token.here");
        when(companyRepository.findByOwnerId(1L)).thenReturn(List.of()); // Sin empresa

        LoginResponse response = authService.login(new LoginRequest("test@karmen.com", "password123"));

        assertNotNull(response);
        assertNull(response.companyId());
        assertNull(response.companyName());
    }
}
