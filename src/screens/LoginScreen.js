import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../store/slices/authSlice";

import AppLogo from "../../assets/images/logotrasparente.png";


const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState(null);

  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const validateEmail = (text) => {
    const reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w\w+)+$/;
    return reg.test(text);
  };

  const handleLogin = () => {
    setValidationError(null);
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setValidationError("Tutti i campi sono obbligatori.");
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setValidationError("Inserisci un indirizzo e-mail valido.");
      return;
    }

    dispatch(loginUser({ email: trimmedEmail, password }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={Platform.OS !== "web" ? Keyboard.dismiss : undefined}

        >
          <Pressable onPress={Platform.OS !== "web" ? Keyboard.dismiss : undefined} style={styles.inner} accessible={false}>
              <View style={styles.header}>
                <Image source={AppLogo} style={styles.logo} resizeMode="contain" />
                <Text style={styles.title}>SWIPE ANNUSA{"\n"}MATCHA</Text>
                <Text style={styles.subtitle}>Match oggi. Amici per sempre.</Text>
              </View>

              <View style={styles.card}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>INDIRIZZO E-MAIL</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="email-outline" size={20} color="#666" />
                    <TextInput
                      style={styles.input}
                      placeholder="Inserisci la tua email"
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (validationError) setValidationError(null);
                      }}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>PASSWORD</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                      <Text style={styles.forgotText}>Password dimenticata?</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="lock-outline" size={20} color="#666" />
                    <TextInput
                      style={styles.input}
                      placeholder="Inserisci la tua password"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (validationError) setValidationError(null);
                      }}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <MaterialCommunityIcons
                        name={showPassword ? "eye" : "eye-off"}
                        size={20}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {(validationError || error) && (
                  <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#D32F2F" />
                    <Text style={styles.errorText}>{validationError || error}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.loginButton, loading && { opacity: 0.7 }]}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.loginButtonText}>Accedi</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.dividerContainer}>
                  <View style={styles.line} />
                  <Text style={styles.dividerText}>Oppure</Text>
                  <View style={styles.line} />
                </View>

                <View style={styles.socialRow}>
                  <TouchableOpacity style={styles.socialButton} onPress={() => Alert.alert("Funzionalità in arrivo", "Disponibile prossimamente.")}>
                    <MaterialCommunityIcons name="google" size={20} color="black" />
                    <Text style={styles.socialText}>Google</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.socialButton} onPress={() => Alert.alert("Funzionalità in arrivo", "Disponibile prossimamente.")}>
                    <MaterialCommunityIcons name="apple" size={20} color="black" />
                    <Text style={styles.socialText}>Apple</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.footer}
                onPress={() => navigation.navigate("Register")}
              >
                <Text style={styles.footerText}>
                  {"Non hai un account? "}
                  <Text style={styles.signUpText}>Registrati</Text>
                </Text>
              </TouchableOpacity>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7F2" },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  inner: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  header: { alignItems: "center", marginBottom: 20 },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1A1A1A",
    textAlign: "center",
    letterSpacing: 2,
    lineHeight: 32,
  },
  subtitle: { fontSize: 14, color: "#666", marginTop: 5, textAlign: "center" },
  card: {
    backgroundColor: "#FFF1E8",
    width: "100%",
    borderRadius: 30,
    padding: 25,
    elevation: 4,
    ...Platform.select({
      web: { boxShadow: "0px 4px 10px rgba(0,0,0,0.1)" },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
    }),
  },
  inputContainer: { marginBottom: 15 },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: { fontSize: 11, fontWeight: "700", color: "#555" },
  forgotText: { fontSize: 11, fontWeight: "700", color: "#0047AB" },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 50,
  },
  input: { flex: 1, marginLeft: 10, fontSize: 15 },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    padding: 10,
    borderRadius: 15,
    marginBottom: 10,
  },
  errorText: { color: "#D32F2F", fontSize: 13, marginLeft: 8, fontWeight: "600", flex: 1 },
  loginButton: {
    backgroundColor: "#0047AB",
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  loginButtonText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
  },
  line: { flex: 1, height: 1, backgroundColor: "#DDD" },
  dividerText: { marginHorizontal: 10, fontSize: 12, color: "#888" },
  socialRow: { flexDirection: "row", justifyContent: "space-between" },
  socialButton: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    width: "48%",
    height: 45,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEE",
  },
  socialText: { marginLeft: 8, fontWeight: "600" },
  footer: { marginTop: 20, marginBottom: 20 },
  footerText: { color: "#666", fontSize: 14 },
  signUpText: { color: "#0047AB", fontWeight: "700" },
});

export default LoginScreen;
