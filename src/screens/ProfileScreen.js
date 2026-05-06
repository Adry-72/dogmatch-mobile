import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import api from "../services/api";
import { logout } from "../store/slices/authSlice";

const BASE_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3000';

export default function ProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const fotoUtente = user?.fotoUrl || user?.foto_url;
  const uriFinale = fotoUtente ? `${BASE_URL}/uploads/${fotoUtente}` : null;
  const nomeCanePrincipale = user?.iMieiCani?.[0]?.nome || "il tuo cane";

  const handleDeleteAccount = () => {
    Alert.alert(
      "Elimina Account 🚨",
      `Sei sicuro? Questa operazione è irreversibile e cancellerà anche tutti i dati di ${nomeCanePrincipale}, i vostri match e i messaggi.`,
      [
        { text: "Annulla", style: "cancel" },
        { text: "Elimina Definitivamente", style: "destructive", onPress: confirmDeletion }
      ]
    );
  };

  const confirmDeletion = async () => {
    try {
      const { data } = await api.delete('/profilo/elimina');
      if (data.successo) {
        Alert.alert("Account Eliminato", "Tutti i tuoi dati sono stati rimossi. Ci dispiace vederti andare via! 🐾");
        dispatch(logout());
        navigation.replace('Login');
      } else {
        throw new Error(data.errore);
      }
    } catch (error) {
      Alert.alert("Errore", error?.message || "Non è stato possibile eliminare l'account. Riprova più tardi.");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.headerTitle}>Mio Profilo</Text>

      <View style={styles.profileHeader}>
        <View style={styles.avatarPlaceholder}>
          {uriFinale ? (
            <Image source={{ uri: uriFinale }} style={styles.profilePhoto} resizeMode="cover" />
          ) : (
            <MaterialCommunityIcons name="account" size={60} color="#AAA" />
          )}
        </View>
        <Text style={styles.name}>{user?.nome || "Utente"} {user?.cognome || ""}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.bioContainer}>
        <Text style={user?.bio ? styles.bioText : [styles.bioText, { color: '#AAA' }]}>
          {user?.bio ? `"${user.bio}"` : "Nessuna bio impostata."}
        </Text>
      </View>

      <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditProfile')}>
        <MaterialCommunityIcons name="pencil" size={20} color="#0047AB" />
        <Text style={styles.editButtonText}>Modifica Profilo e Cane</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={() => dispatch(logout())}>
        <MaterialCommunityIcons name="logout" size={18} color="red" style={{ marginRight: 5 }} />
        <Text style={styles.logoutText}>Esci dall'account</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          <Text style={styles.deleteText}>Elimina Account</Text>
        </TouchableOpacity>
      </View>
  </ScrollView>
  );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7F2",
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 30,
    color: "#1A1A1A",
    textAlign: 'center'
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 3,
    borderColor: "#FFF",
    overflow: 'hidden',
    elevation: 5,
    ...Platform.select({
      web: { boxShadow: "0px 2px 4px rgba(0,0,0,0.2)" },
      default: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
    }),
  },
  profilePhoto: {
    width: '100%',
    height: '100%',
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1A1A1A",
    textTransform: 'capitalize'
  },
  email: {
    color: "#666",
    marginBottom: 10,
    fontSize: 14
  },
  bioContainer: {
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 15,
    width: "100%",
    marginBottom: 25,
    elevation: 1,
  },
  bioText: {
    textAlign: "center",
    color: "#555",
    fontStyle: "italic",
    lineHeight: 20
  },
  editButton: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#0047AB",
    width: "100%",
    justifyContent: "center",
    marginBottom: 10,
  },
  editButtonText: {
    color: "#0047AB",
    fontWeight: "800",
    fontSize: 16,
    marginLeft: 10
  },
  logoutButton: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  logoutText: {
    color: "red",
    fontWeight: "700",
    fontSize: 14
  },
  footer: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: 20,
    marginBottom: 20
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: '#FF3B30',
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 16,
  },
});
