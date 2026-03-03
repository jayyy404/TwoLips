const FLOWER_MAP = {
  flower: { name: "Sakura", emoji: "🌸" },
  sunflower: { name: "Sunflower", emoji: "🌻" },
  pinklily: { name: "Pink Lily", emoji: "🌺" },
  blueflax: { name: "Blue Flax", emoji: "🪻" },
};

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { senderUid, animationType } = req.body || {};

  if (!senderUid || !animationType) {
    return res
      .status(400)
      .json({ error: "Missing senderUid or animationType" });
  }

  const partnerUid = senderUid === "user_a" ? "user_b" : "user_a";
  const flower = FLOWER_MAP[animationType] || { name: "flower", emoji: "🌸" };

  try {
    const payload = {
      app_id: process.env.ONESIGNAL_APP_ID,
      include_aliases: { external_id: [partnerUid] },
      target_channel: "push",
      headings: { en: `${flower.name} ${flower.emoji}` },
      contents: { en: `Did the ${flower.name} bloom? ${flower.emoji}` },
      url: "https://twolips.vercel.app",
    };

    console.log(
      "[send-poke] Sending to:",
      partnerUid,
      "payload:",
      JSON.stringify(payload),
    );

    const response = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${process.env.ONESIGNAL_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log(
      "[send-poke] OneSignal response:",
      response.status,
      JSON.stringify(data),
    );

    if (!response.ok) {
      return res
        .status(500)
        .json({ error: "Failed to send notification", details: data });
    }

    return res.json({
      success: true,
      id: data.id,
      recipients: data.recipients,
      data,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
