import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Dimensions,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import { client, databases, storage } from "../config/appwrite";
import {
    APPWRITE_ENDPOINT,
    APPWRITE_PROJECT_ID,
    BUCKET_TEMPORARY_IMAGES,
    COLLECTION_GARDEN,
    COLLECTION_TEMPORARY_IMAGES,
    DATABASE_ID,
    GARDEN_DOC_ID,
    ONESIGNAL_APP_ID,
} from "../config/constant";
import { COLORS } from "../config/theme";
import { useAuth } from "../context/AuthContent";
import { takePhoto } from "../utils/camera";
import { ID, Query, uploadSnapFile } from "../utils/storage";
import { showToast } from "../utils/toast";

import FlowerSelector from "../components/garden/FlowerSelector";
import SnapCard from "../components/garden/SnapCard";
import FullscreenAnimation from "../components/overlays/FullscreenAnimation";
import SnapViewer from "../components/overlays/SnapViewer";
import CameraButton from "../components/ui/CameraButton";

interface SnapItem {
  id: string;
  imageUrl: string | null;
  file_id: string | null;
  sender_id: string | null;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const lottieRef = useRef<LottieView>(null);

  const [selectedAnimation, setSelectedAnimation] = useState("flower");
  const [isSendingPoke, setIsSendingPoke] = useState(false);
  const [isSendingImage, setIsSendingImage] = useState(false);

  // Snap queue
  const [snapQueue, setSnapQueue] = useState<SnapItem[]>([]);
  const [currentSnapIndex, setCurrentSnapIndex] = useState(0);

  // Modals
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationType, setAnimationType] = useState("flower");
  const [showSnapViewer, setShowSnapViewer] = useState(false);

  // Web / PWA state
  const [webNotifEnabled, setWebNotifEnabled] = useState(false);
  const [showPWABanner, setShowPWABanner] = useState(false);

  const currentSnap = snapQueue.length > 0 ? snapQueue[currentSnapIndex] : null;
  const currentSnapImage = currentSnap?.imageUrl ?? null;
  const hasSnaps = snapQueue.length > 0;

  // Initialize OneSignal on web
  useEffect(() => {
    if (Platform.OS !== "web") return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    // iOS users outside PWA shell can't receive notifications
    if (isIOS && !isStandalone) {
      setShowPWABanner(true);
    }

    if (typeof Notification !== "undefined") {
      if (Notification.permission === "granted") {
        setWebNotifEnabled(true);
      }
    }

    // Initialize OneSignal
    if (ONESIGNAL_APP_ID) {
      import("../utils/notifications").then(({ initializeOneSignal }) => {
        initializeOneSignal(ONESIGNAL_APP_ID);
      });
    }
  }, []);

  // Login OneSignal when user is available
  useEffect(() => {
    if (Platform.OS !== "web" || !user) return;
    if (!ONESIGNAL_APP_ID) return;

    import("../utils/notifications").then(async ({ loginOneSignal }) => {
      await loginOneSignal(user.$id);
    });
  }, [user]);

  // Build storage file URL
  const getFileUrl = (fileId: string) =>
    `${APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_TEMPORARY_IMAGES}/files/${fileId}/view?project=${APPWRITE_PROJECT_ID}`;

  // Listen to garden (poke) changes via Appwrite Realtime
  useEffect(() => {
    if (!user) return;

    const channel = `databases.${DATABASE_ID}.collections.${COLLECTION_GARDEN}.documents.${GARDEN_DOC_ID}`;
    const unsubscribe = client.subscribe(channel, (response) => {
      const payload = response.payload as Record<string, any>;
      if (!payload) return;

      const pokedBy = payload.poked_by as string | undefined;
      if (pokedBy === user.$id) return;

      const anim = (payload.animation_type as string) || "flower";
      setAnimationType(anim);
      setShowAnimation(true);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  // Listen to snaps via Appwrite Realtime
  const loadSnaps = useCallback(async () => {
    if (!user) return;

    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_TEMPORARY_IMAGES,
        [Query.equal("viewed", false), Query.orderDesc("$createdAt")],
      );

      const relevantDocs = response.documents.filter(
        (doc) => doc.sender_id !== user.$id,
      );

      if (relevantDocs.length === 0) {
        setSnapQueue([]);
        setCurrentSnapIndex(0);
        return;
      }

      const newQueue: SnapItem[] = relevantDocs.map((doc) => ({
        id: doc.$id,
        imageUrl: doc.file_id ? getFileUrl(doc.file_id) : null,
        file_id: doc.file_id ?? null,
        sender_id: doc.sender_id ?? null,
      }));

      setSnapQueue(newQueue);
      setCurrentSnapIndex((prev) => (prev >= newQueue.length ? 0 : prev));
    } catch (e) {
      console.error("Error loading snaps:", e);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    loadSnaps();

    const channel = `databases.${DATABASE_ID}.collections.${COLLECTION_TEMPORARY_IMAGES}.documents`;
    const unsubscribe = client.subscribe(channel, () => {
      loadSnaps();
    });

    return () => {
      unsubscribe();
    };
  }, [user, loadSnaps]);

  // Enable web notifications (must be called from user click for browser prompt)
  const enableWebNotifications = useCallback(async () => {
    if (!user) return;

    try {
      if (typeof Notification === "undefined") {
        showToast("", "Notifications not supported on this browser");
        return;
      }

      if (Notification.permission === "denied") {
        showToast(
          "",
          "Notifications were blocked. Please reset in browser settings.",
        );
        return;
      }

      // Already granted — ensure OneSignal subscription
      if (Notification.permission === "granted") {
        setWebNotifEnabled(true);
        if (window.OneSignal) {
          try {
            await window.OneSignal.login(user.$id);
            if (window.OneSignal.User?.PushSubscription) {
              await window.OneSignal.User.PushSubscription.optIn();
            }
          } catch (e) {
            console.warn("OneSignal login error:", e);
          }
        }
        showToast("", "Notifications enabled! 🔔");
        return;
      }

      // Permission is "default" — request via OneSignal first
      if (window.OneSignal?.Notifications?.requestPermission) {
        await window.OneSignal.Notifications.requestPermission();
        const granted = window.OneSignal.Notifications.permission === true;

        if (granted) {
          setWebNotifEnabled(true);
          await window.OneSignal.login(user.$id);
          if (window.OneSignal.User?.PushSubscription) {
            await window.OneSignal.User.PushSubscription.optIn();
          }
          showToast("", "Notifications enabled! 🔔");
        } else {
          showToast("", "Notifications were not allowed");
        }
      } else {
        // Fallback: native browser API
        const result = await Notification.requestPermission();

        if (result === "granted") {
          setWebNotifEnabled(true);
          if (window.OneSignal) {
            await window.OneSignal.login(user.$id);
            if (window.OneSignal.User?.PushSubscription) {
              await window.OneSignal.User.PushSubscription.optIn();
            }
          }
          showToast("", "Notifications enabled! 🔔");
        } else {
          showToast("", "Notifications were not allowed");
        }
      }
    } catch (e) {
      console.error("Error enabling web notifications:", e);
      showToast("Error", "Could not enable notifications");
    }
  }, [user]);

  // Snap navigation──
  const nextSnap = () => {
    if (currentSnapIndex < snapQueue.length - 1) {
      setCurrentSnapIndex((prev) => prev + 1);
    }
  };

  const previousSnap = () => {
    if (currentSnapIndex > 0) {
      setCurrentSnapIndex((prev) => prev - 1);
    }
  };

  // Delete snap
  const deleteSnap = async (docId: string, fileId: string | null) => {
    try {
      if (fileId) {
        try {
          await storage.deleteFile(BUCKET_TEMPORARY_IMAGES, fileId);
        } catch (e) {
          console.warn("Could not delete storage file:", e);
        }
      }

      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_TEMPORARY_IMAGES,
        docId,
      );
      // Realtime listener will update the queue
    } catch (e) {
      console.error("Error deleting snap:", e);
    }
  };

  // Open fullscreen snap viewer
  const openFullscreenSnap = () => {
    if (!currentSnapImage || snapQueue.length === 0) return;
    setShowSnapViewer(true);
  };

  const onSnapViewerClose = async () => {
    if (currentSnap) {
      await deleteSnap(currentSnap.id, currentSnap.file_id);
    }
    setShowSnapViewer(false);

    if (snapQueue.length <= 1) {
      showToast("", "All snaps viewed! 🌸");
    }
  };

  // Send poke
  const sendPoke = async () => {
    if (!user || isSendingPoke) return;

    setIsSendingPoke(true);

    try {
      try {
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTION_GARDEN,
          GARDEN_DOC_ID,
          {
            poked_by: user.$id,
            poked_at: new Date().toISOString(),
            animation_type: selectedAnimation,
          },
        );
      } catch {
        await databases.createDocument(
          DATABASE_ID,
          COLLECTION_GARDEN,
          GARDEN_DOC_ID,
          {
            poked_by: user.$id,
            poked_at: new Date().toISOString(),
            animation_type: selectedAnimation,
          },
        );
      }

      lottieRef.current?.play();
      sendPokeNotification();
      showToast("", "Bouquet sent! 🌸");
    } catch (e) {
      showToast("Error", `Unable to poke: ${e}`);
    } finally {
      setIsSendingPoke(false);
    }
  };

  // Send poke notification via Vercel API
  const sendPokeNotification = async () => {
    try {
      console.log(
        "[Poke] Sending notification for:",
        user!.$id,
        "animation:",
        selectedAnimation,
      );
      const response = await fetch("/api/send-poke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderUid: user!.$id,
          animationType: selectedAnimation,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log("[Poke] Notification sent successfully:", data);
      } else {
        console.error("[Poke] API error:", response.status, data);
      }
    } catch (e) {
      console.error("[Poke] Error sending poke notification:", e);
    }
  };

  // Send image snap
  const sendImage = async () => {
    if (!user || isSendingImage) return;

    setIsSendingImage(true);

    try {
      const photo = await takePhoto();
      if (!photo) {
        setIsSendingImage(false);
        return;
      }

      // On web, verify the File object is present and non-empty
      if (Platform.OS === "web" && (!photo.file || photo.file.size === 0)) {
        showToast("Error", "Camera returned an empty file. Please try again.");
        setIsSendingImage(false);
        return;
      }

      // Upload file to Storage bucket
      const fileId = await uploadSnapFile(photo);

      // Create document in temporary_images collection
      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_TEMPORARY_IMAGES,
        ID.unique(),
        {
          sender_id: user.$id,
          file_id: fileId,
          viewed: false,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      );

      sendSnapNotification();
      showToast("", "Snap sent successfully! 📸");
    } catch (e: any) {
      const msg = e?.message || e?.response?.message || String(e);
      console.error("Error sending image:", msg, e);
      showToast("Error", `Unable to send snap: ${msg}`);
    } finally {
      setIsSendingImage(false);
    }
  };

  // Send snap notification via Vercel API
  const sendSnapNotification = async () => {
    try {
      console.log("[Snap] Sending notification for:", user!.$id);
      const response = await fetch("/api/send-snap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderUid: user!.$id }),
      });
      const data = await response.json();
      if (response.ok) {
        console.log("[Snap] Notification sent successfully:", data);
      } else {
        console.error("[Snap] API error:", response.status, data);
      }
    } catch (e) {
      console.error("[Snap] Error sending snap notification:", e);
    }
  };

  // Swipe gesture for snap navigation
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-30, 30])
    .onEnd((event) => {
      if (!hasSnaps) return;
      if (event.translationX > 50) {
        previousSnap();
      } else if (event.translationX < -50) {
        nextSnap();
      }
    });

  // Render
  return (
    <LinearGradient
      colors={["#FFD1DC", "#B3E5FC"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>OUR GARDEN</Text>
        <Text style={styles.headerSubtitle}>a bloom just for us</Text>
      </View>

      {/* Memory Frame */}
      <View style={styles.frameArea}>
        <GestureDetector gesture={swipeGesture}>
          <View style={styles.cardWrapper}>
            <SnapCard
              currentSnapImage={currentSnapImage}
              hasSnaps={hasSnaps}
              currentSnapIndex={currentSnapIndex}
              totalSnaps={snapQueue.length}
              isSendingPoke={isSendingPoke}
              selectedAnimation={selectedAnimation}
              lottieRef={lottieRef}
              onTap={hasSnaps ? openFullscreenSnap : sendPoke}
            />
          </View>
        </GestureDetector>
      </View>

      {/* PWA Install Banner (iOS non-standalone) */}
      {showPWABanner && (
        <View style={styles.pwaBanner}>
          <Text style={styles.pwaBannerText}>
            📲 Tap <Text style={styles.pwaBannerBold}>Share</Text> →{" "}
            <Text style={styles.pwaBannerBold}>Add to Home Screen</Text> to
            enable notifications.
          </Text>
        </View>
      )}

      {/* Enable Notifications Button (web PWA) */}
      {Platform.OS === "web" && !webNotifEnabled && !showPWABanner && (
        <Pressable
          style={styles.enableNotifButton}
          onPress={enableWebNotifications}
        >
          <Text style={styles.enableNotifText}>🔔 Enable Notifications</Text>
        </Pressable>
      )}

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Camera button floating above dock */}
        <View style={styles.cameraWrapper}>
          <CameraButton isSending={isSendingImage} onPress={sendImage} />
        </View>

        {/* Flower dock */}
        <FlowerSelector
          selectedAnimation={selectedAnimation}
          onSelect={setSelectedAnimation}
        />
      </View>

      {/* Fullscreen animation modal (poke received) */}
      <Modal
        visible={showAnimation}
        animationType="fade"
        transparent={false}
        onRequestClose={() => setShowAnimation(false)}
      >
        <FullscreenAnimation
          animationType={animationType}
          onClose={() => setShowAnimation(false)}
        />
      </Modal>

      {/* Snap viewer modal */}
      <Modal
        visible={showSnapViewer}
        animationType="fade"
        transparent={false}
        onRequestClose={onSnapViewerClose}
      >
        <SnapViewer
          imageUrl={currentSnapImage}
          currentIndex={currentSnapIndex}
          totalSnaps={snapQueue.length}
          onClose={onSnapViewerClose}
        />
      </Modal>
    </LinearGradient>
  );
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const CARD_H = Math.min(SCREEN_H * 0.5, SCREEN_W * 0.8 * (4 / 3));
const CARD_W = CARD_H * (3 / 4);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    paddingTop: Platform.OS === "web" ? 40 : 60,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 3,
    color: "rgba(255, 255, 255, 0.9)",
    textTransform: "uppercase",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 4,
    fontStyle: "italic",
    letterSpacing: 1,
  },

  frameArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cardWrapper: {
    width: CARD_W,
    height: CARD_H,
  },

  pwaBanner: {
    backgroundColor: "rgba(255, 255, 255, 0.45)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
  },
  pwaBannerText: {
    color: COLORS.text,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  pwaBannerBold: {
    fontWeight: "700",
  },
  enableNotifButton: {
    backgroundColor: "rgba(255, 255, 255, 0.45)",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 24,
    marginHorizontal: 20,
    marginBottom: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
    zIndex: 50,
    position: "relative",
    ...(Platform.OS === "web"
      ? { cursor: "pointer" as any, userSelect: "none" as any }
      : {}),
  },
  enableNotifText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
  },

  bottomControls: {
    alignItems: "center",
    paddingBottom: Platform.OS === "web" ? 16 : 34,
  },
  cameraWrapper: {
    marginBottom: Platform.OS === "web" ? 6 : 12,
    zIndex: 10,
  },
});
