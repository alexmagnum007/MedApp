import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View, TouchableOpacity } from 'react-native';
import { useTranslation } from '../i18n';

import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import HomeScreen from '../screens/Home/HomeScreen';
import MedicinesScreen from '../screens/Medicines/MedicinesScreen';
import AddMedicineScreen from '../screens/Medicines/AddMedicineScreen';
import MedicineDetailScreen from '../screens/Medicines/MedicineDetailScreen';
import DiseasesScreen from '../screens/Diseases/DiseasesScreen';
import AddDiseaseScreen from '../screens/Diseases/AddDiseaseScreen';
import DoctorsScreen from '../screens/Doctors/DoctorsScreen';
import AddDoctorScreen from '../screens/Doctors/AddDoctorScreen';
import AddAppointmentScreen from '../screens/Doctors/AddAppointmentScreen';
import DoctorExamsScreen from '../screens/Doctors/DoctorExamsScreen';
import ExamsScreen from '../screens/Exams/ExamsScreen';
import AddExamScreen from '../screens/Exams/AddExamScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MedicinesStack() {
  const { t } = useTranslation();
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#2563eb' }, headerTintColor: '#fff' }}>
      <Stack.Screen name="MedicinesList" component={MedicinesScreen} options={{ title: t('medicines.title') }} />
      <Stack.Screen name="AddMedicine" component={AddMedicineScreen} options={{ title: t('medicines.addMedicine') }} />
      <Stack.Screen name="MedicineDetail" component={MedicineDetailScreen} options={({ route }: any) => ({ title: route.params?.medicine?.name ?? t('nav.detail') })} />
    </Stack.Navigator>
  );
}

function DiseasesStack() {
  const { t } = useTranslation();
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#2563eb' }, headerTintColor: '#fff' }}>
      <Stack.Screen name="DiseasesList" component={DiseasesScreen} options={{ title: t('diseases.title') }} />
      <Stack.Screen name="AddDisease" component={AddDiseaseScreen} options={{ title: t('diseases.addDisease') }} />
    </Stack.Navigator>
  );
}

function DoctorsStack() {
  const { t } = useTranslation();
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#2563eb' }, headerTintColor: '#fff' }}>
      <Stack.Screen name="DoctorsList" component={DoctorsScreen} options={{ title: t('doctors.title') }} />
      <Stack.Screen name="AddDoctor" component={AddDoctorScreen} options={{ title: t('doctors.addDoctor') }} />
      <Stack.Screen name="AddAppointment" component={AddAppointmentScreen} options={{ title: t('appointments.title') }} />
      <Stack.Screen name="DoctorExams" component={DoctorExamsScreen}
        options={({ route }: any) => ({ title: t('nav.examsDoctor', { name: route.params?.doctor?.name ?? '' }) })} />
    </Stack.Navigator>
  );
}

function ExamsStack() {
  const { t } = useTranslation();
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#2563eb' }, headerTintColor: '#fff' }}>
      <Stack.Screen name="ExamsList" component={ExamsScreen} options={{ title: t('exams.title') }} />
      <Stack.Screen name="AddExam" component={AddExamScreen} options={{ title: t('exams.addExam') }} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { logout } = useAuth();
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: { paddingBottom: 4 },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof MaterialIcons.glyphMap> = {
            Home: 'home',
            Medicines: 'medication',
            Diseases: 'sick',
            Doctors: 'local-hospital',
            Exams: 'science',
          };
          return <MaterialIcons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{
        title: t('nav.home'), headerShown: true,
        headerStyle: { backgroundColor: '#2563eb' }, headerTintColor: '#fff', headerTitle: 'MedApp',
        headerRight: () => (
          <TouchableOpacity onPress={logout} style={{ marginRight: 12 }}>
            <MaterialIcons name="logout" size={24} color="#fff" />
          </TouchableOpacity>
        ),
      }} />
      <Tab.Screen name="Medicines" component={MedicinesStack} options={{ title: t('nav.medicines') }} />
      <Tab.Screen name="Diseases" component={DiseasesStack} options={{ title: t('nav.diseases') }} />
      <Tab.Screen name="Doctors" component={DoctorsStack} options={{ title: t('nav.doctors') }} />
      <Tab.Screen name="Exams" component={ExamsStack} options={{ title: t('nav.exams') }} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
