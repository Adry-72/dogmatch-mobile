import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
    ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';

const ForgotPasswordScreen = ({ navigation }) => {
    const [step, setStep] = useState(1); // 1: email, 2: otp + nuova password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [nuovaPassword, setNuovaPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleRequestOtp = async () => {
        if (!email.trim()) {
            Alert.alert('Attenzione', 'Inserisci la tua email.');
            return;
        }
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email: email.trim() });
            setStep(2);
        } catch {
            Alert.alert('Errore', 'Impossibile inviare il codice. Riprova più tardi.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!otp.trim() || !nuovaPassword.trim()) {
            Alert.alert('Attenzione', 'Compila tutti i campi.');
            return;
        }
        if (nuovaPassword.length < 6) {
            Alert.alert('Attenzione', 'La password deve essere di almeno 6 caratteri.');
            return;
        }
        setLoading(true);
        try {
            await api.post('/auth/reset-password', {
                email: email.trim(),
                otp: otp.trim(),
                nuovaPassword
            });
            Alert.alert('Fatto! 🐾', 'Password aggiornata con successo.', [
                { text: 'Accedi', onPress: () => navigation.navigate('Login') }
            ]);
        } catch (err) {
            const msg = err.response?.data?.errore || 'Codice non valido o scaduto.';
            Alert.alert('Errore', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                    <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#0047AB" />
                    </TouchableOpacity>

                    <View style={styles.iconContainer}>
                        <MaterialCommunityIcons name="lock-reset" size={60} color="#0047AB" />
                    </View>

                    <Text style={styles.title}>Password dimenticata?</Text>

                    {step === 1 ? (
                        <>
                            <Text style={styles.subtitle}>
                                Inserisci la tua email. Ti invieremo un codice di 6 cifre per reimpostare la password.
                            </Text>
                            <View style={styles.card}>
                                <Text style={styles.label}>INDIRIZZO E-MAIL</Text>
                                <View style={styles.inputWrapper}>
                                    <MaterialCommunityIcons name="email-outline" size={20} color="#666" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="La tua email"
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                    />
                                </View>
                                <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleRequestOtp} disabled={loading}>
                                    {loading
                                        ? <ActivityIndicator color="#FFF" />
                                        : <Text style={styles.btnText}>Invia codice</Text>
                                    }
                                </TouchableOpacity>
                            </View>
                        </>
                    ) : (
                        <>
                            <Text style={styles.subtitle}>
                                Abbiamo inviato un codice a <Text style={{ fontWeight: '800', color: '#0047AB' }}>{email}</Text>.{'\n'}
                                Controlla la casella email (e lo spam).
                            </Text>
                            <View style={styles.card}>
                                <Text style={styles.label}>CODICE DI VERIFICA</Text>
                                <View style={styles.inputWrapper}>
                                    <MaterialCommunityIcons name="numeric" size={20} color="#666" />
                                    <TextInput
                                        style={[styles.input, styles.otpInput]}
                                        placeholder="123456"
                                        value={otp}
                                        onChangeText={setOtp}
                                        keyboardType="number-pad"
                                        maxLength={6}
                                    />
                                </View>

                                <Text style={[styles.label, { marginTop: 15 }]}>NUOVA PASSWORD</Text>
                                <View style={styles.inputWrapper}>
                                    <MaterialCommunityIcons name="lock-outline" size={20} color="#666" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Minimo 6 caratteri"
                                        value={nuovaPassword}
                                        onChangeText={setNuovaPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        <MaterialCommunityIcons name={showPassword ? 'eye' : 'eye-off'} size={20} color="#666" />
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleResetPassword} disabled={loading}>
                                    {loading
                                        ? <ActivityIndicator color="#FFF" />
                                        : <Text style={styles.btnText}>Reimposta password</Text>
                                    }
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.resend} onPress={() => { setStep(1); setOtp(''); }}>
                                    <Text style={styles.resendText}>Non hai ricevuto il codice? Riprova</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF7F2' },
    scroll: { flexGrow: 1, padding: 24 },
    back: { marginBottom: 20 },
    iconContainer: { alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 26, fontWeight: '900', color: '#1A1A1A', textAlign: 'center', marginBottom: 10 },
    subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 25, lineHeight: 20 },
    card: {
        backgroundColor: '#FFF1E8', borderRadius: 30, padding: 25,
        ...Platform.select({
            web: { boxShadow: '0px 4px 10px rgba(0,0,0,0.1)' },
            default: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 }
        })
    },
    label: { fontSize: 11, fontWeight: '700', color: '#555', marginBottom: 8 },
    inputWrapper: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
        borderRadius: 20, paddingHorizontal: 15, height: 50, marginBottom: 5
    },
    input: { flex: 1, marginLeft: 10, fontSize: 15 },
    otpInput: { fontSize: 22, fontWeight: '900', letterSpacing: 6, textAlign: 'center' },
    btn: {
        backgroundColor: '#0047AB', height: 50, borderRadius: 25,
        justifyContent: 'center', alignItems: 'center', marginTop: 20
    },
    btnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    resend: { marginTop: 15, alignItems: 'center' },
    resendText: { color: '#0047AB', fontSize: 13, fontWeight: '600' },
});

export default ForgotPasswordScreen;
