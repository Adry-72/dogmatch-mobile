import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator, Alert, Image,
    Linking,
    ScrollView, StyleSheet,
    Switch, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile } from '../store/slices/authSlice';

const BASE_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3000';
const PLACEHOLDER_USER = require('../../assets/images/logotrasparente.png');

const EditProfileScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const { user, loading } = useSelector((state) => state.auth);

    const mioCane = user?.iMieiCani?.[0];

    const [nome, setNome] = useState("");
    const [cognome, setCognome] = useState("");
    const [email, setEmail] = useState("");
    const [telefono, setTelefono] = useState("");
    const [ruolo, setRuolo] = useState("privato");
    const [bio, setBio] = useState("");
    const [posizione, setPosizione] = useState(null);
    const [userImage, setUserImage] = useState(null);
    const [localizing, setLocalizing] = useState(false);

    const [caneNome, setCaneNome] = useState("");
    const [caneRazza, setCaneRazza] = useState("");
    const [caneEta, setCaneEta] = useState("");
    const [canePeso, setCanePeso] = useState("");
    const [caneSesso, setCaneSesso] = useState("M");
    const [caneTaglia, setCaneTaglia] = useState("Media");
    const [caneDescrizione, setCaneDescrizione] = useState("");
    const [disponibile, setDisponibile] = useState(false);
    const [infoSanitarie, setInfoSanitarie] = useState("");
    const [dogImage, setDogImage] = useState(null);
    const [pedigreeFile, setPedigreeFile] = useState(null);

    useEffect(() => {
        if (!user) return;
        const cane = user?.iMieiCani?.[0];
        setNome(user.nome || "");
        setCognome(user.cognome || "");
        setEmail(user.email || "");
        setTelefono(user.telefono || "");
        setRuolo(user.ruolo || "privato");
        setBio(user.bio || "");
        if (user.posizione) {
            try {
                setPosizione(typeof user.posizione === 'string' ? JSON.parse(user.posizione) : user.posizione);
            } catch {}
        }
        if (cane) {
            setCaneNome(cane.nome || "");
            setCaneRazza(cane.razza || "");
            setCaneEta(cane.eta?.toString() || "");
            setCanePeso(cane.peso?.toString() || "");
            setCaneSesso(cane.sesso || "M");
            setCaneTaglia(cane.taglia || "Media");
            setCaneDescrizione(cane.descrizione || "");
            setDisponibile(cane.disponibilitaRiproduttiva || false);
            setInfoSanitarie(cane.infoSanitarie || "");
        }
    }, [user]);

    const pickImage = async (target) => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });
        if (!result.canceled) {
            if (target === 'user') setUserImage(result.assets[0].uri);
            if (target === 'dog') setDogImage(result.assets[0].uri);
            if (target === 'pedigree') setPedigreeFile(result.assets[0].uri);
        }
    };

    const handleGetLocation = async () => {
        setLocalizing(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Ops!", "Abbiamo bisogno dei permessi GPS.");
                return;
            }
            const loc = await Location.getCurrentPositionAsync({});
            const rev = await Location.reverseGeocodeAsync(loc.coords);
            setPosizione({ lat: loc.coords.latitude, lng: loc.coords.longitude, citta: rev[0]?.city || "Sconosciuta" });
        } catch {
            Alert.alert("Errore", "Impossibile rilevare la posizione.");
        } finally {
            setLocalizing(false);
        }
    };

    const handleViewPedigree = () => {
        if (mioCane?.pedigreeUrl || pedigreeFile) {
            Alert.alert("Pedigree", "Cosa desideri fare con il certificato?", [
                { text: "Annulla", style: "cancel" },
                {
                    text: "Visualizza",
                    onPress: () => {
                        const url = pedigreeFile ? pedigreeFile : `${BASE_URL}/uploads/${mioCane.pedigreeUrl}`;
                        Linking.openURL(url);
                    }
                },
                { text: "Sostituisci", onPress: () => pickImage('pedigree') }
            ]);
        } else {
            pickImage('pedigree');
        }
    };

    const handleSave = async () => {
        const formData = new FormData();
        formData.append('nome', nome);
        formData.append('cognome', cognome);
        formData.append('email', email);
        formData.append('telefono', telefono);
        formData.append('ruolo', ruolo);
        formData.append('bio', bio);
        formData.append('posizione', JSON.stringify(posizione));
        formData.append('caneNome', caneNome);
        formData.append('caneRazza', caneRazza);
        formData.append('caneEta', caneEta);
        formData.append('canePeso', canePeso);
        formData.append('caneSesso', caneSesso);
        formData.append('caneTaglia', caneTaglia);
        formData.append('descrizione', caneDescrizione);
        formData.append('disponibilitaRiproduttiva', disponibile ? "true" : "false");
        formData.append('infoSanitarie', infoSanitarie);

        if (userImage) formData.append('fotoUtente', { uri: userImage, name: userImage.split('/').pop(), type: 'image/jpeg' });
        if (dogImage) formData.append('fotoCane', { uri: dogImage, name: dogImage.split('/').pop(), type: 'image/jpeg' });
        if (pedigreeFile) formData.append('pedigreeDoc', { uri: pedigreeFile, name: pedigreeFile.split('/').pop(), type: 'image/jpeg' });

        try {
            await dispatch(updateProfile(formData)).unwrap();
            Alert.alert("Profilo Aggiornato! 🐾", "Le modifiche sono state salvate con successo.");
            navigation.goBack();
        } catch (err) {
            Alert.alert("Errore", err?.message || "Errore durante il salvataggio.");
        }
    };

    const userImageSource = userImage
        ? { uri: userImage }
        : user?.fotoUrl
            ? { uri: `${BASE_URL}/uploads/${user.fotoUrl}` }
            : PLACEHOLDER_USER;

    const dogImageSource = dogImage
        ? { uri: dogImage }
        : mioCane?.fotoUrl
            ? { uri: `${BASE_URL}/uploads/${mioCane.fotoUrl}` }
            : null;

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>I Tuoi Dati</Text>
                <TouchableOpacity onPress={() => pickImage('user')} style={styles.avatarContainer}>
                    <Image source={userImageSource} style={styles.userAvatar} />
                    <View style={styles.badge}><MaterialCommunityIcons name="camera" size={16} color="#FFF" /></View>
                </TouchableOpacity>

                <CustomInput label="NOME" value={nome} onChangeText={setNome} />
                <CustomInput label="COGNOME" value={cognome} onChangeText={setCognome} />
                <CustomInput label="EMAIL" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                <CustomInput label="TELEFONO" value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />

                <Text style={styles.label}>RUOLO</Text>
                <View style={styles.selectorRow}>
                    {['privato', 'allevatore', 'appassionato'].map(r => (
                        <TouchableOpacity key={r} style={[styles.selBtn, ruolo === r && styles.selBtnActive]} onPress={() => setRuolo(r)}>
                            <Text style={[styles.selBtnText, ruolo === r && styles.selBtnTextActive]}>{r.toUpperCase()}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>BIO</Text>
                <TextInput style={[styles.input, styles.textArea]} value={bio} onChangeText={setBio} multiline placeholder="Parlaci di te..." />

                <TouchableOpacity style={styles.locBtn} onPress={handleGetLocation}>
                    <Text style={styles.locBtnText}>
                        {localizing ? "Rilevamento..." : posizione ? `📍 ${posizione.citta}` : "Aggiorna Posizione GPS"}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dati di {caneNome || 'Cane'}</Text>
                <TouchableOpacity onPress={() => pickImage('dog')} style={styles.avatarContainer}>
                    {dogImageSource ? (
                        <Image source={dogImageSource} style={styles.dogAvatar} />
                    ) : (
                        <View style={[styles.dogAvatar, styles.dogAvatarPlaceholder]}>
                            <MaterialCommunityIcons name="dog" size={40} color="#CCC" />
                        </View>
                    )}
                    <View style={styles.badge}><MaterialCommunityIcons name="camera" size={18} color="#FFF" /></View>
                </TouchableOpacity>

                <CustomInput label="NOME CANE" value={caneNome} onChangeText={setCaneNome} />
                <View style={styles.row}>
                    <CustomInput label="ETÀ" value={caneEta} onChangeText={setCaneEta} keyboardType="numeric" style={{ flex: 1, marginRight: 10 }} />
                    <CustomInput label="PESO (KG)" value={canePeso} onChangeText={setCanePeso} keyboardType="numeric" style={{ flex: 1 }} />
                </View>
                <CustomInput label="RAZZA" value={caneRazza} onChangeText={setCaneRazza} />

                <Text style={styles.label}>TAGLIA</Text>
                <View style={styles.selectorRow}>
                    {['Piccola', 'Media', 'Grande', 'Gigante'].map(t => (
                        <TouchableOpacity key={t} style={[styles.selBtn, caneTaglia === t && styles.selBtnActive]} onPress={() => setCaneTaglia(t)}>
                            <Text style={[styles.selBtnText, caneTaglia === t && styles.selBtnTextActive]}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>SESSO</Text>
                <View style={styles.selectorRow}>
                    {['M', 'F'].map(s => (
                        <TouchableOpacity key={s} style={[styles.selBtn, caneSesso === s && styles.selBtnActive]} onPress={() => setCaneSesso(s)}>
                            <Text style={[styles.selBtnText, caneSesso === s && styles.selBtnTextActive]}>{s === 'M' ? "MASCHIO" : "FEMMINA"}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.switchBox}>
                    <Text style={styles.switchLabel}>Disponibile per Accoppiamento?</Text>
                    <Switch value={disponibile} onValueChange={setDisponibile} trackColor={{ true: "#0047AB" }} />
                </View>

                <Text style={styles.label}>DESCRIZIONE CANE</Text>
                <TextInput style={[styles.input, styles.textArea]} value={caneDescrizione} onChangeText={setCaneDescrizione} multiline placeholder="Carattere, abitudini..." />
                <CustomInput label="INFO SANITARIE" value={infoSanitarie} onChangeText={setInfoSanitarie} placeholder="Es: Vaccinato, no allergie" />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Certificazioni</Text>
                <TouchableOpacity
                    style={[styles.pedigreeBtn, (pedigreeFile || mioCane?.pedigreeUrl) && styles.pedigreeSuccess]}
                    onPress={handleViewPedigree}
                >
                    <MaterialCommunityIcons
                        name={pedigreeFile || mioCane?.pedigreeUrl ? "file-check" : "file-certificate"}
                        size={24}
                        color={pedigreeFile || mioCane?.pedigreeUrl ? "#2E7D32" : "#0047AB"}
                    />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={[styles.pedigreeText, (pedigreeFile || mioCane?.pedigreeUrl) && { color: '#2E7D32' }]}>
                            {pedigreeFile ? "Nuovo Pedigree selezionato ✅" :
                                mioCane?.pedigreeUrl ? "Pedigree già presente" : "Carica Foto Pedigree"}
                        </Text>
                        {(mioCane?.pedigreeUrl || pedigreeFile) && (
                            <Text style={{ fontSize: 10, color: '#666' }}>Tocca per visualizzare o sostituire</Text>
                        )}
                    </View>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.mainSaveBtn} onPress={handleSave} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.mainSaveBtnText}>SALVA TUTTO</Text>}
            </TouchableOpacity>
        </ScrollView>
    );
};

const CustomInput = ({ label, value, onChangeText, style, ...props }) => (
    <View style={[styles.inputBox, style]}>
        <Text style={styles.label}>{label}</Text>
        <TextInput style={styles.input} value={value} onChangeText={onChangeText} {...props} />
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF7F2', padding: 15 },
    section: { backgroundColor: '#FFF', borderRadius: 25, padding: 20, marginBottom: 15, elevation: 2 },
    sectionTitle: { fontSize: 18, fontWeight: '900', color: '#0047AB', marginBottom: 15 },
    avatarContainer: { alignSelf: 'center', marginBottom: 20, position: 'relative' },
    userAvatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#EEE' },
    dogAvatar: { width: 110, height: 110, borderRadius: 25, backgroundColor: '#EEE' },
    dogAvatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
    badge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#0047AB', padding: 6, borderRadius: 15 },
    inputBox: { marginBottom: 12 },
    label: { fontSize: 10, fontWeight: '800', color: '#666', marginBottom: 4 },
    input: { backgroundColor: '#F8F8F8', borderRadius: 12, padding: 12, fontSize: 14, color: '#333' },
    textArea: { height: 70, textAlignVertical: 'top' },
    row: { flexDirection: 'row' },
    selectorRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    selBtn: { flex: 1, padding: 10, backgroundColor: '#F2F2F2', marginHorizontal: 3, borderRadius: 10, alignItems: 'center' },
    selBtnActive: { backgroundColor: '#0047AB' },
    selBtnText: { fontSize: 10, fontWeight: '700', color: '#888' },
    selBtnTextActive: { color: '#FFF' },
    locBtn: { padding: 15, borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#0047AB', alignItems: 'center', marginTop: 5 },
    locBtnText: { color: '#0047AB', fontWeight: '700', fontSize: 12 },
    switchBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 },
    switchLabel: { fontWeight: '700', color: '#444', fontSize: 12 },
    pedigreeBtn: {
        flexDirection: 'row', alignItems: 'center', padding: 15,
        backgroundColor: '#E3F2FD', borderRadius: 12,
        borderStyle: 'dashed', borderWidth: 1, borderColor: '#0047AB'
    },
    pedigreeSuccess: { backgroundColor: '#E8F5E9', borderColor: '#2E7D32' },
    pedigreeText: { color: '#0047AB', fontWeight: '700', fontSize: 12 },
    mainSaveBtn: { backgroundColor: '#0047AB', padding: 18, borderRadius: 20, alignItems: 'center', marginBottom: 50 },
    mainSaveBtnText: { color: '#FFF', fontWeight: '900', fontSize: 16 }
});

export default EditProfileScreen;
