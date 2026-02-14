module.exports = async (req, res) => {
  try {
    const appResponse = await fetch(
      `https://api.onesignal.com/apps/${process.env.ONESIGNAL_APP_ID}`,
      {
        headers: {
          Authorization: `Key ${process.env.ONESIGNAL_API_KEY}`,
        },
      },
    );
    const appData = await appResponse.json();

    const playersResponse = await fetch(
      `https://api.onesignal.com/players?app_id=${process.env.ONESIGNAL_APP_ID}&limit=10`,
      {
        headers: {
          Authorization: `Key ${process.env.ONESIGNAL_API_KEY}`,
        },
      },
    );
    const playersData = await playersResponse.json();

    return res.json({
      app: {
        name: appData.name,
        players: appData.players,
        messageable_players: appData.messageable_players,
        chrome_web_origin: appData.chrome_web_origin,
        safari_site_origin: appData.safari_site_origin,
      },
      subscriptions: {
        total: playersData.total_count,
        players: (playersData.players || []).map((p) => ({
          id: p.id,
          device_type: p.device_type,
          created_at: p.created_at,
          last_active: p.last_active,
          notification_types: p.notification_types,
          external_user_id: p.external_user_id,
          invalid_identifier: p.invalid_identifier,
          has_push_token: !!p.identifier,
          session_count: p.session_count,
        })),
      },
      api_key_set: !!process.env.ONESIGNAL_API_KEY,
      api_key_prefix: process.env.ONESIGNAL_API_KEY
        ? process.env.ONESIGNAL_API_KEY.substring(0, 15) + "..."
        : "MISSING",
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
