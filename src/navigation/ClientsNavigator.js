/**
 * ClientsNavigator — stack de la pestaña Clientes.
 *
 * QuoteDetailClients es una tercera instancia de QuoteDetailScreen (ya
 * existían QuoteDetail en NewQuote y QuoteDetailHistory en History) — React
 * Navigation no permite compartir una pantalla entre stacks distintos, así
 * que cada stack necesita la suya para que "volver" lleve al lugar correcto.
 */
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import ClientListScreen from '../screens/clients/ClientListScreen';
import ClientDetailScreen from '../screens/clients/ClientDetailScreen';
import ClientFormScreen from '../screens/clients/ClientFormScreen';
import QuoteDetailScreen from '../screens/quotes/QuoteDetailScreen';

const ClientsStack = createStackNavigator();

export default function ClientsNavigator() {
  return (
    <ClientsStack.Navigator screenOptions={{ headerShown: false }}>
      <ClientsStack.Screen name="ClientList" component={ClientListScreen} />
      <ClientsStack.Screen name="ClientDetail" component={ClientDetailScreen} />
      <ClientsStack.Screen name="ClientForm" component={ClientFormScreen} />
      <ClientsStack.Screen name="QuoteDetailClients" component={QuoteDetailScreen} />
    </ClientsStack.Navigator>
  );
}
