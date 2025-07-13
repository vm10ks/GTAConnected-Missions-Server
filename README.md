
---

# 🎮 Vice City Online With Missions

**Vice City Online With Missions** is a GTA: Vice City multiplayer server built using [GTA Connected](https://gtaconnected.com/) — bringing mission-based gameplay and synced player experiences into an online environment.

---

## 🏁 Project Status

> 🧠 **We're looking for a developer to continue the project!**

This is an open call to anyone who wants to:

* Maintain and expand the mission system.
* Improve syncing between players (missions, Peds, vehicles).
* Rebuild and improve the logic that once enabled true **cooperative mission play**.

---

## ✅ Major Milestone: First-Ever Working Mission Sync

After 4 days of deep debugging, we **successfully achieved** something never done before in VC multiplayer:
📌 **Synchronized missions between teammates**, with:

* Shared mission state
* Enemy behavior and Ped AI sync
* Shared objective status
* Real-time failure and success sync

> 👥 All players were inside the same mission instance — together.

---

### ⚠️ Important Note: Mission Sync Script Lost

The script (specifically `missions.js` server and client side) that made this mission sync possible was **unintentionally lost**, and the exact edits made to get it working are no longer remembered.

> 🧠 While the server config remains stable, the core mission logic will need to be rebuilt or reverse-engineered by future contributors.

---

### 🔧 Server Config That Made It Work

```xml
<syncmethod>interval</syncmethod>
<syncinterval>10</syncinterval>
<syncpacketpriority>high</syncpacketpriority>
<syncpacketreliable>true</syncpacketreliable>
<bullet_sync>1</bullet_sync>
<multithreaded>true</multithreaded>

<streaminterval>500</streaminterval>
<streamindistance>250</streamindistance>
<streamoutdistance>350</streamoutdistance>
<pickupstreamindistance>40</pickupstreamindistance>
<pickupstreamoutdistance>60</pickupstreamoutdistance>

<compresspackets>true</compresspackets>
<packetcompressionlevel>9</packetcompressionlevel>

<latency_reduction>1</latency_reduction>
<vehext_percent>20</vehext_percent>
<vehext_ping_limit>200</vehext_ping_limit>
```

---

### 🧾 Live Log Proof (Mission Sync Success)

```log
<[09/07/2025 - 23:08:36]> vm10k: are they shootin u 
<[09/07/2025 - 23:08:37]> Lougawou: yea they are
<[09/07/2025 - 23:20:16]> vm10k: they are shooting us both
<[09/07/2025 - 23:20:28]> Lougawou: yea
<[09/07/2025 - 23:21:11]> vm10k: is lance health appear in ur screen?
<[09/07/2025 - 23:21:22]> Lougawou: yea
<[09/07/2025 - 23:22:13]> Lougawou: i killed him
<[09/07/2025 - 23:22:20]> Lougawou: yep
<[09/07/2025 - 23:22:20]> vm10k: its still running on my side
<[09/07/2025 - 23:26:12]> vm10k: it's now synced and not chaotic
<[09/07/2025 - 23:26:40]> vm10k: ped sync is fixed too
```

---

### 🎯 Bonus Immersion: Blip Behavior Like Vice City NPCs

> 🟣 Lou's player blip **automatically transformed into a small pink blip**, just like **bodyguards or ally NPCs** from the original Vice City missions.

This wasn't intentional — it was a side effect of the working mission logic and Ped behavior.
It’s a clear sign the sync was **mimicking single-player mechanics in multiplayer** — a rare achievement.

---

## ⚙️ Features

* 🧭 **Mission Gamemode** – Structured cooperative missions.
* 🔁 **Live Weather & Time Sync**
* 👥 **Player Sync with Peds & Vehicles**
* 💬 Chat, Join/Quit messages, interiors & player color support
* 💾 SQLite-backed persistent data saving
* 🌍 High player cap (127)

---

## 💬 Community

* **Discord Server**: [Join us](https://discord.gg/Fq5Cu8dVyp)
---

## 🛠 How to Use

1. Download [GTA Connected](https://gtaconnected.com/)
2. Clone this repo.
3. Place `server.xml` into your GTA Connected server directory.
4. Run the server using the included config.
5. Connect using the GTA Connected client.

---

## 🧑‍💻 Developer Needed

We’re specifically looking for someone to:

* Recreate the missing `missions.js` logic that enabled mission sync
* Expand cooperative mechanics and blip behaviors
* Contribute to a more immersive, stable GTA VC co-op experience

You’ll be working with a historic project that has already **proven what's possible** — and now needs your help to go further.

---

## 🧾 License

This project is community-driven. Feel free to fork, build, and expand. Contributions are welcome via pull request or Discord.

---

Discovery by `@vm10k`

---

Let me know if you'd like this as a Markdown file download, or if you want a contributors section added.
