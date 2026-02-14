module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { senderUid } = req.body || {};

  if (!senderUid) {
    return res.status(400).json({ error: "Missing senderUid" });
  }

  const partnerUid = senderUid === "user_a" ? "user_b" : "user_a";

  try {
    const response = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${process.env.ONESIGNAL_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: process.env.ONESIGNAL_APP_ID,
        include_aliases: { external_id: [partnerUid] },
        target_channel: "push",
        headings: { en: "TwoLips 🌷" },
        contents: { en: "Your lover sent a snap! 📸" },
        url: "https://twolips.vercel.app",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res
        .status(500)
        .json({ error: "Failed to send notification", details: data });
    }

    return res.json({ success: true, id: data.id });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
