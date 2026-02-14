import { Platform } from "react-native";
import { Account, Client, Databases, Storage } from "react-native-appwrite";
import {
  APPWRITE_ENDPOINT,
  APPWRITE_PLATFORM,
  APPWRITE_PROJECT_ID,
} from "./constant";

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

if (Platform.OS !== "web") {
  client.setPlatform(APPWRITE_PLATFORM);
}

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export { client };
export default client;
