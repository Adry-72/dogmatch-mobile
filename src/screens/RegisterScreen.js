import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";

import AppLogo from "../../assets/images/logotrasparente.png";
import { registerUser } from "../store/slices/authSlice";

const EMAIL_REGEX = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w\w+)+$/;

const RegisterScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const { loading, error } = useSelector((state) => state.auth);

    const [step, setStep] = useState(1);
    const [validationError, setValidationError] = useState(null);
    const [localizing, setLocalizing] = useState(false);
    const [userImage, setUserImage] = useState(null);

    const [nome, setNome] = useState("");
    const [cognome, setCognome] = useState("");
    const [email, setEmail] = useState("");
    const [telefono, setTelefono] = useState('');
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [bio, setBio] = useState("");
    const [posizione, setPosizione] = useState(null);
    const [ruolo, setRuolo] = useState("privato");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const opzioniRuolo = [
        { label: "Privato", value: "privato" },
        { label: "Allevatore", value: "allevatore" },
        { label: "Appassionato", value: "appassionato" },
    ];

    const [image, setImage] = useState(null);
    const [caneNome, setCaneNome] = useState("");
    const [caneRazza, setCaneRazza] = useState("");
    const [caneEta, setCaneEta] = useState("");
    const [canePeso, setCanePeso] = useState("");
    const [caneSessoState, setCaneSessoState] = useState("M");
    const [caneTaglia, setCaneTaglia] = useState("Media");
    const [caneDescrizione, setCaneDescrizione] = useState("");
    const [disponibile, setDisponibile] = useState(false);
    const [infoSanitarie, setInfoSanitarie] = useState("");
    const [pedigreeFile, setPedigreeFile] = useState(null);

    const pickUserImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });
        if (!result.canceled) setUserImage(result.assets[0].uri);
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });
        if (!result.canceled) setImage(result.assets[0].uri);
    };

    const pickPedigree = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.8,
        });
        if (!result.canceled) setPedigreeFile(result.assets[0]);
    };

    const handleHeaderBack = () => {
        if (step === 2) setStep(1);
        else navigation.goBack();
    };

    const handleGetLocation = async () => {
        setLocalizing(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permesso negato", "Abbiamo bisogno della posizione.");
                return;
            }
            const location = await Location.getCurrentPositionAsync({});
            const reverseGeocode = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });
            if (reverseGeocode.length > 0) {
                const indirizzo = reverseGeocode[0];
                setPosizione({
                    lat: location.coords.latitude,
                    lng: location.coords.longitude,
                    citta: indirizzo.city || "Sconosciuta",
                    provincia: indirizzo.subregion || indirizzo.city,
                    regione: indirizzo.region || "Sconosciuta"
                });
            }
        } catch {
            Alert.alert("Errore", "Impossibile rilevare la posizione.");
        } finally {
            setLocalizing(false);
        }
    };

    const handleNextStep = () => {
        setValidationError(null);
        if (!nome || !cognome || !email || !password || !confirmPassword || !telefono || !posizione) {
            setValidationError("Completa tutti i campi e rileva la posizione 📍");
            return;
        }
        if (!EMAIL_REGEX.test(email.trim())) {
            setValidationError("Inserisci un indirizzo e-mail valido.");
            return;
        }
        if (password.length < 8) {
            setValidationError("La password deve essere di almeno 8 caratteri.");
            return;
        }
        if (password !== confirmPassword) {
            setValidationError("Le password non coincidono.");
            return;
        }
        setStep(2);
    };

    const handleRegister = async () => {
        setValidationError(null);

        if (!image) {
            setValidationError("La foto del cane è obbligatoria!");
            return;
        }
        if (!caneNome || !caneEta || !canePeso) {
            setValidationError("Dati del cane mancanti.");
            return;
        }

        const formData = new FormData();

        formData.append('nome', nome.trim());
        formData.append('cognome', cognome.trim());
        formData.append('ruolo', ruolo);
        formData.append('email', email.trim().toLowerCase());
        formData.append('telefono', telefono.toString());
        formData.append('password', password);
        formData.append('posizione', JSON.stringify(posizione));
        formData.append('provincia', posizione?.provincia || "");
        formData.append('regione', posizione?.regione || "");
        formData.append('bio', bio.trim());

        if (userImage) {
            const asset = { uri: userImage, name: userImage.split('/').pop(), type: 'image/jpeg' };
            formData.append('fotoUtente', asset);
        }

        formData.append('caneNome', caneNome.trim());
        formData.append('caneRazza', caneRazza.trim() || "Meticcio");
        formData.append('caneEta', caneEta.toString());
        formData.append('canePeso', canePeso.toString());
        formData.append('caneSesso', caneSessoState);
        formData.append('caneTaglia', caneTaglia);
        formData.append('descrizione', caneDescrizione.trim());
        formData.append('disponibilitaRiproduttiva', disponibile ? "true" : "false");
        formData.append('infoSanitarie', infoSanitarie.trim());

        const imageAsset = { uri: image, name: image.split('/').pop(), type: 'image/jpeg' };
        formData.append('fotoCane', imageAsset);

        if (pedigreeFile) {
            formData.append('pedigreeDoc', {
                uri: pedigreeFile.uri,
                name: pedigreeFile.uri.split('/').pop(),
                type: pedigreeFile.type || 'image/jpeg'
            });
        }

        try {
            await dispatch(registerUser(formData)).unwrap();
            Alert.alert("Successo! 🎉", `Profilo creato! Ora ${caneNome} può cercare nuovi amici. 🐾`);
            navigation.navigate('Login');
        } catch (err) {
            setValidationError(err?.message || err || "Registrazione fallita.");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                        <TouchableOpacity style={styles.backButton} onPress={handleHeaderBack}>
                            <MaterialCommunityIcons name="chevron-left" size={36} color="#1A1A1A" />
                        </TouchableOpacity>

                        <View style={styles.header}>
                            <Image source={AppLogo} style={styles.logo} resizeMode="contain" />
                            <Text style={styles.title}>{step === 1 ? "Il tuo Profilo" : "Il tuo Cane"}</Text>
                        </View>

                        <View style={styles.card}>
                            {(validationError || error) && <ErrorBox message={validationError || error} />}

                            {step === 1 ? (
                                <>
                                    <TouchableOpacity onPress={pickUserImage} style={styles.userPhotoPicker}>
                                        {userImage ? (
                                            <Image source={{ uri: userImage }} style={styles.userPreviewImage} />
                                        ) : (
                                            <View style={styles.userPhotoPlaceholder}>
                                                <MaterialCommunityIcons name="camera-account" size={40} color="#0047AB" />
                                                <Text style={styles.userPhotoText}>AGGIUNGI FOTO</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>

                                    <CustomInput label="NOME" icon="account-outline" placeholder="Inserisci il tuo nome" value={nome} onChangeText={setNome} />
                                    <CustomInput label="COGNOME" icon="account-details-outline" placeholder="Inserisci il tuo cognome" value={cognome} onChangeText={setCognome} />

                                    <Text style={styles.sectionLabel}>MI ISCRIVO COME:</Text>
                                    <View style={styles.ruoloRow}>
                                        {opzioniRuolo.map((opt) => (
                                            <TouchableOpacity
                                                key={opt.value}
                                                style={[styles.ruoloBtn, ruolo === opt.value && styles.ruoloBtnActive]}
                                                onPress={() => setRuolo(opt.value)}
                                            >
                                                <Text style={[styles.ruoloBtnText, ruolo === opt.value && styles.ruoloBtnTextActive]}>
                                                    {opt.label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <CustomInput label="TELEFONO" icon="phone-outline" placeholder="Inserisci il tuo telefono" value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
                                    <CustomInput label="EMAIL" icon="email-outline" placeholder="Inserisci il tuo indirizzo email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                                    <CustomInput label="PASSWORD" icon="lock-outline" placeholder="Inserisci la tua password" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} isPassword toggleShow={() => setShowPassword(!showPassword)} showPassword={showPassword} />
                                    <CustomInput label="CONFERMA" icon="lock-check-outline" placeholder="Conferma la tua password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirmPassword} isPassword toggleShow={() => setShowConfirmPassword(!showConfirmPassword)} showPassword={showConfirmPassword} />
                                    <CustomInput label="BIO" icon="text-account" placeholder="Ciao! ..." value={bio} onChangeText={setBio} multiline numberOfLines={4} style={styles.textArea} />

                                    <View style={styles.locationContainer}>
                                        {!posizione ? (
                                            <TouchableOpacity style={styles.locationBtn} onPress={handleGetLocation}>
                                                {localizing ? <ActivityIndicator color="#0047AB" /> : <Text style={styles.locationBtnText}>📍 Rileva Posizione</Text>}
                                            </TouchableOpacity>
                                        ) : (
                                            <View style={styles.locationSuccess}>
                                                <Text style={styles.locationText}>📍 {posizione.citta} ({posizione.provincia}), {posizione.regione}</Text>
                                                <TouchableOpacity onPress={() => setPosizione(null)}><Text style={styles.changeLocation}>Cambia</Text></TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                    <TouchableOpacity style={styles.mainButton} onPress={handleNextStep}><Text style={styles.buttonText}>Continua</Text></TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <TouchableOpacity onPress={pickImage} style={[styles.photoPicker, !image && styles.photoPickerEmpty]}>
                                        {image ? <Image source={{ uri: image }} style={styles.previewImage} /> : (
                                            <View style={{ alignItems: 'center' }}>
                                                <MaterialCommunityIcons name="camera-plus" size={40} color="#0047AB" />
                                                <Text style={{ color: '#0047AB', fontSize: 10, fontWeight: '700' }}>CARICA FOTO</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>

                                    <CustomInput label="NOME CANE" placeholder="Il tuo cane si chiama..." icon="dog" value={caneNome} onChangeText={setCaneNome} />
                                    <CustomInput label="RAZZA" icon="dna" placeholder="La razza del tuo cane..." value={caneRazza} onChangeText={setCaneRazza} />

                                    <View style={styles.row}>
                                        <View style={{ flex: 1, marginRight: 10 }}><CustomInput label="ETÀ" icon="calendar" value={caneEta} onChangeText={setCaneEta} keyboardType="numeric" /></View>
                                        <View style={{ flex: 1 }}><CustomInput label="PESO (KG)" icon="weight" value={canePeso} onChangeText={setCanePeso} keyboardType="numeric" /></View>
                                    </View>

                                    <Text style={styles.sectionLabel}>SESSO</Text>
                                    <View style={styles.selectorRow}>
                                        {['M', 'F'].map(s => (
                                            <TouchableOpacity key={s} style={[styles.selectorBtn, caneSessoState === s && styles.selectorActive]} onPress={() => setCaneSessoState(s)}>
                                                <Text style={[styles.selectorText, caneSessoState === s && styles.selectorTextActive]}>{s === 'M' ? "Maschio" : "Femmina"}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <Text style={styles.sectionLabel}>TAGLIA</Text>
                                    <View style={styles.selectorRow}>
                                        {['Piccola', 'Media', 'Grande', 'Gigante'].map((t) => (
                                            <TouchableOpacity key={t} style={[styles.selectorBtn, caneTaglia === t && styles.selectorActive]} onPress={() => setCaneTaglia(t)}>
                                                <Text style={[styles.selectorText, caneTaglia === t && styles.selectorTextActive]}>{t}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <View style={styles.switchContainer}>
                                        <Text style={styles.switchLabel}>Disponibile per accoppiamento?</Text>
                                        <Switch value={disponibile} onValueChange={setDisponibile} trackColor={{ false: "#D1D1D1", true: "#0047AB" }} />
                                    </View>

                                    <CustomInput
                                        label="DESCRIZIONE CANE"
                                        icon="pencil-outline"
                                        placeholder="Carattere, giochi preferiti, abitudini..."
                                        value={caneDescrizione}
                                        onChangeText={setCaneDescrizione}
                                        multiline
                                        numberOfLines={4}
                                        style={styles.textArea}
                                    />

                                    <CustomInput label="INFO SANITARIE" icon="medical-bag" value={infoSanitarie} onChangeText={setInfoSanitarie} multiline numberOfLines={3} style={styles.textArea} />

                                    <TouchableOpacity style={styles.documentBtn} onPress={pickPedigree}>
                                        <MaterialCommunityIcons name="image-plus" size={24} color="#0047AB" />
                                        <Text style={styles.documentBtnText}>{pedigreeFile ? "Pedigree Caricato ✅" : "Carica Foto Pedigree (Galleria)"}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.mainButton} onPress={handleRegister} disabled={loading}>
                                        {loading ? <ActivityIndicator color="#FFF" /> : (
                                            <View style={styles.buttonContent}>
                                                <MaterialCommunityIcons name="paw" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                                <Text style={styles.buttonText}>REGISTRATI ORA</Text>
                                                <MaterialCommunityIcons name="paw" size={20} color="#FFF" style={{ marginLeft: 8 }} />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setStep(1)} style={styles.backLink}><Text style={styles.backLinkText}>Modifica dati umano</Text></TouchableOpacity>
                                </>
                            )}
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    );
};

const CustomInput = ({ label, icon, value, onChangeText, isPassword, showPassword, toggleShow, style, ...props }) => (
    <View style={styles.inputBox}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.inputWrapper, style]}>
            <MaterialCommunityIcons name={icon} size={20} color="#666" />
            <TextInput
                style={styles.textInput}
                value={value}
                onChangeText={onChangeText}
                placeholderTextColor="#999"
                {...props}
            />
            {isPassword && (
                <TouchableOpacity onPress={toggleShow}>
                    <MaterialCommunityIcons name={showPassword ? "eye-off" : "eye"} size={22} color="#0047AB" />
                </TouchableOpacity>
            )}
        </View>
    </View>
);

const ErrorBox = ({ message }) => (
    <View style={styles.errorCard}>
        <MaterialCommunityIcons name="alert-circle" size={18} color="#D32F2F" />
        <Text style={styles.errorText}>{message}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#FFF7F2" },
    userPhotoPicker: {
        width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFF',
        alignSelf: 'center', justifyContent: 'center', alignItems: 'center',
        marginBottom: 20, borderWidth: 2, borderColor: '#0047AB',
        borderStyle: 'dashed', overflow: 'hidden'
    },
    userPreviewImage: { width: '100%', height: '100%' },
    userPhotoPlaceholder: { alignItems: 'center' },
    userPhotoText: { fontSize: 9, fontWeight: '800', color: '#0047AB', marginTop: 5 },
    backButton: { alignSelf: 'flex-start', marginBottom: -20, marginLeft: -10, padding: 5 },
    scrollContent: { padding: 25, paddingTop: 10, alignItems: "center" },
    header: { alignItems: "center", marginBottom: 20 },
    logo: { width: 80, height: 80, marginBottom: 10 },
    title: { fontSize: 24, fontWeight: "900", color: "#1A1A1A" },
    card: { backgroundColor: "#FFF1E8", width: "100%", borderRadius: 30, padding: 20, elevation: 4 },
    inputBox: { marginBottom: 15 },
    label: { fontSize: 10, fontWeight: "800", color: "#444", marginBottom: 5 },
    inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 15, paddingHorizontal: 15, height: 50 },
    textArea: { height: 100, paddingTop: 10, textAlignVertical: 'top' },
    textInput: { flex: 1, marginLeft: 10, fontSize: 14, color: "#333" },
    row: { flexDirection: 'row' },
    sectionLabel: { fontSize: 10, fontWeight: "800", color: "#444", marginTop: 10, marginBottom: 8 },
    ruoloRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    ruoloBtn: { flex: 1, backgroundColor: '#FFF', paddingVertical: 12, marginHorizontal: 4, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0' },
    ruoloBtnActive: { backgroundColor: '#0047AB', borderColor: '#0047AB' },
    ruoloBtnText: { fontSize: 11, fontWeight: '700', color: '#666' },
    ruoloBtnTextActive: { color: '#FFF' },
    selectorRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    selectorBtn: { flex: 1, backgroundColor: '#FFF', padding: 12, borderRadius: 12, alignItems: 'center', marginHorizontal: 3 },
    selectorActive: { backgroundColor: '#0047AB' },
    selectorText: { color: '#666', fontWeight: '700', fontSize: 11 },
    selectorTextActive: { color: '#FFF' },
    photoPicker: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#FFF', alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden' },
    photoPickerEmpty: { borderStyle: 'dashed', borderWidth: 2, borderColor: '#0047AB' },
    previewImage: { width: '100%', height: '100%' },
    switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, backgroundColor: '#FFF', padding: 12, borderRadius: 15 },
    switchLabel: { fontSize: 13, fontWeight: '700', color: '#444' },
    documentBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 15, borderStyle: 'dashed', borderWidth: 1, borderColor: '#0047AB', marginBottom: 20 },
    documentBtnText: { marginLeft: 10, color: '#0047AB', fontWeight: '700', fontSize: 13 },
    mainButton: { backgroundColor: "#0047AB", height: 60, borderRadius: 20, justifyContent: "center", alignItems: "center", marginTop: 10 },
    buttonContent: { flexDirection: 'row', alignItems: 'center' },
    buttonText: { color: "#FFF", fontWeight: "900", fontSize: 17, letterSpacing: 1 },
    locationContainer: { marginBottom: 15 },
    locationBtn: { backgroundColor: '#E3F2FD', padding: 15, borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: '#0047AB', borderStyle: 'dashed' },
    locationBtnText: { color: '#0047AB', fontWeight: '700' },
    locationSuccess: { backgroundColor: '#E8F5E9', padding: 15, borderRadius: 15, flexDirection: 'row', justifyContent: 'space-between' },
    locationText: { color: '#2E7D32', fontWeight: '700' },
    changeLocation: { color: '#666', textDecorationLine: 'underline' },
    backLink: { marginTop: 15, alignItems: 'center' },
    backLinkText: { color: '#666', fontWeight: '700', textDecorationLine: 'underline' },
    errorCard: { flexDirection: "row", backgroundColor: "#FFEBEE", padding: 12, borderRadius: 12, marginBottom: 15 },
    errorText: { color: "#D32F2F", marginLeft: 8, fontSize: 13, fontWeight: "600" }
});

export default RegisterScreen;
