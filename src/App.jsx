import { useState, useMemo } from "react";

// ─── constants & helpers ──────────────────────────────────────────────────────
const uid = (p = "E") => p + "-" + Math.floor(1000 + Math.random() * 9000);
const nowT = () => new Date().toTimeString().slice(0, 5);
const todayD = () => new Date().toISOString().slice(0, 10);
const COLORS = {
  raw: "#c8ff00",
  coated: "#00d4ff",
  defects: "#ff4d4d",
  reworked: "#ff9800",
};
const ROLES = {
  HANDLER: "material_handler",
  SUPERVISOR: "supervisor",
  ADMIN: "admin",
};
const ROLE_LABELS = {
  material_handler: "Material Handler",
  supervisor: "Supervisor",
  admin: "Admin",
};
const ROLE_COLORS = {
  material_handler: "#555",
  supervisor: "#00d4ff",
  admin: "#c8ff00",
};

// ─── seed users ───────────────────────────────────────────────────────────────
const SEED_USERS = [
  {
    id: "U-001",
    name: "Akash R.",
    email: "akash@selectfinishing.com",
    password: "admin123",
    role: ROLES.ADMIN,
  },
  {
    id: "U-002",
    name: "Mike T.",
    email: "mike@selectfinishing.com",
    password: "super123",
    role: ROLES.SUPERVISOR,
  },
  {
    id: "U-003",
    name: "Jordan L.",
    email: "jordan@selectfinishing.com",
    password: "handler123",
    role: ROLES.HANDLER,
  },
];

const SEED_PARTS = [
  { partNumber: "EC-1042", description: "Bracket Assembly – Left" },
  { partNumber: "EC-1043", description: "Bracket Assembly – Right" },
  { partNumber: "EC-2087", description: "Frame Rail Connector" },
  { partNumber: "EC-3301", description: "Hinge Pin Plate" },
];

const SEED_RUNS = [
  {
    id: "R-0041",
    date: todayD(),
    time: "14:32",
    shift: "Afternoon",
    loggedBy: "U-003",
    items: [
      {
        id: uid("I"),
        partNumber: "EC-1042",
        description: "Bracket Assembly – Left",
        qty: 200,
        raw: 200,
        coated: 188,
        defects: 7,
        reworked: 5,
      },
      {
        id: uid("I"),
        partNumber: "EC-3301",
        description: "Hinge Pin Plate",
        qty: 150,
        raw: 150,
        coated: 141,
        defects: 5,
        reworked: 4,
      },
    ],
  },
  {
    id: "R-0040",
    date: todayD(),
    time: "09:15",
    shift: "Morning",
    loggedBy: "U-003",
    items: [
      {
        id: uid("I"),
        partNumber: "EC-1043",
        description: "Bracket Assembly – Right",
        qty: 315,
        raw: 315,
        coated: 290,
        defects: 12,
        reworked: 9,
      },
      {
        id: uid("I"),
        partNumber: "EC-2087",
        description: "Frame Rail Connector",
        qty: 410,
        raw: 410,
        coated: 375,
        defects: 18,
        reworked: 14,
      },
    ],
  },
];

// ─── permission helpers ───────────────────────────────────────────────────────
const can = {
  log: (u) => [ROLES.HANDLER, ROLES.SUPERVISOR, ROLES.ADMIN].includes(u?.role),
  reports: (u) => [ROLES.SUPERVISOR, ROLES.ADMIN].includes(u?.role),
  editDelete: (u) => [ROLES.SUPERVISOR, ROLES.ADMIN].includes(u?.role),
  users: (u) => u?.role === ROLES.ADMIN,
};

// ─── tiny components ──────────────────────────────────────────────────────────
function Sparkbar({ value, max, color }) {
  return (
    <div
      style={{
        width: "100%",
        height: 3,
        background: "#1e1e1e",
        borderRadius: 2,
        marginTop: 10,
      }}
    >
      <div
        style={{
          width: `${Math.min((value / max) * 100, 100)}%`,
          height: "100%",
          background: color,
          borderRadius: 2,
          transition: "width .6s ease",
        }}
      />
    </div>
  );
}

function TrendChart({ runs }) {
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const week = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (4 - i));
    const iso = d.toISOString().slice(0, 10);
    const items = runs.filter((r) => r.date === iso).flatMap((r) => r.items);
    return {
      day: DAYS[(d.getDay() + 6) % 7],
      raw: items.reduce((s, it) => s + it.raw, 0),
      coated: items.reduce((s, it) => s + it.coated, 0),
      defects: items.reduce((s, it) => s + it.defects, 0),
      reworked: items.reduce((s, it) => s + it.reworked, 0),
    };
  });
  const maxVal = Math.max(
    ...week.flatMap((d) =>
      ["raw", "coated", "defects", "reworked"].map((k) => d[k]),
    ),
    1,
  );
  const H = 80;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", height: H + 24 }}>
      {week.map((d, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 2,
              height: H,
            }}
          >
            {["raw", "coated", "defects", "reworked"].map((k) => (
              <div
                key={k}
                title={`${k}: ${d[k]}`}
                style={{
                  width: 5,
                  height: Math.max((d[k] / maxVal) * H, 2),
                  background: COLORS[k],
                  borderRadius: "2px 2px 0 0",
                  opacity: 0.85,
                }}
              />
            ))}
          </div>
          <span
            style={{
              fontSize: 10,
              color: "#444",
              fontFamily: "'DM Mono',monospace",
            }}
          >
            {d.day}
          </span>
        </div>
      ))}
    </div>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.82)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        backdropFilter: "blur(4px)",
        overflowY: "auto",
        padding: "24px 16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#111",
          border: "1px solid #222",
          borderRadius: 12,
          padding: "28px 32px",
          width: wide ? "720px" : "460px",
          maxWidth: "95vw",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <span style={{ fontSize: 14, color: "#e0e0e0", fontWeight: 500 }}>
            {title}
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#555",
              cursor: "pointer",
              fontSize: 20,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const labelSt = {
  fontSize: 10,
  color: "#3a3a3a",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  fontFamily: "'DM Mono',monospace",
  display: "block",
  marginBottom: 6,
};

function FInput({
  label,
  type = "text",
  value,
  onChange,
  accent,
  placeholder,
  list,
  disabled,
}) {
  return (
    <div>
      <label
        style={{
          ...labelSt,
          ...(accent ? { color: accent, opacity: 0.7 } : {}),
        }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || ""}
        min={type === "number" ? 0 : undefined}
        list={list}
        disabled={disabled}
        style={{
          width: "100%",
          padding: "8px 10px",
          borderRadius: 6,
          border: "1px solid #222",
          background: disabled ? "#0d0d0d" : "#0a0a0a",
          color: disabled ? "#444" : "#e0e0e0",
          fontSize: 12,
          fontFamily: "'DM Mono',monospace",
          outline: "none",
          cursor: disabled ? "not-allowed" : "text",
        }}
        onFocus={(e) => {
          if (!disabled) e.target.style.borderColor = accent || "#444";
        }}
        onBlur={(e) => (e.target.style.borderColor = "#222")}
      />
    </div>
  );
}

function ItemRow({ item, index, knownParts, onChange, onRemove, isOnly }) {
  const handlePartNum = (val) => {
    const found = knownParts.find((p) => p.partNumber === val);
    onChange({
      ...item,
      partNumber: val,
      description: found ? found.description : item.description,
    });
  };
  return (
    <div
      style={{
        background: "#0a0a0a",
        border: "1px solid #1e1e1e",
        borderRadius: 8,
        padding: "14px 16px",
        marginBottom: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontSize: 10,
            color: "#333",
            fontFamily: "'DM Mono',monospace",
            letterSpacing: "0.06em",
          }}
        >
          PART {index + 1}
        </span>
        {!isOnly && (
          <button
            onClick={onRemove}
            style={{
              background: "none",
              border: "none",
              color: "#333",
              cursor: "pointer",
              fontSize: 12,
              padding: "2px 6px",
              borderRadius: 4,
            }}
            onMouseEnter={(e) => (e.target.style.color = "#ff4d4d")}
            onMouseLeave={(e) => (e.target.style.color = "#333")}
          >
            remove
          </button>
        )}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <div>
          <label style={labelSt}>Part Number</label>
          <input
            value={item.partNumber}
            onChange={(e) => handlePartNum(e.target.value)}
            list="part-list"
            placeholder="EC-0000"
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid #222",
              background: "#0a0a0a",
              color: "#e0e0e0",
              fontSize: 12,
              fontFamily: "'DM Mono',monospace",
              outline: "none",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#c8ff00")}
            onBlur={(e) => (e.target.style.borderColor = "#222")}
          />
        </div>
        <FInput
          label="Description"
          value={item.description}
          onChange={(v) => onChange({ ...item, description: v })}
          placeholder="Part description"
        />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5,1fr)",
          gap: 8,
        }}
      >
        {[
          ["qty", "Qty", "#e0e0e0"],
          ["raw", "Raw", COLORS.raw],
          ["coated", "Coated", COLORS.coated],
          ["defects", "Defects", COLORS.defects],
          ["reworked", "Reworked", COLORS.reworked],
        ].map(([k, lbl, clr]) => (
          <div key={k}>
            <label style={{ ...labelSt, color: clr, opacity: 0.7 }}>
              {lbl}
            </label>
            <input
              type="number"
              min="0"
              value={item[k]}
              onChange={(e) => onChange({ ...item, [k]: e.target.value })}
              style={{
                width: "100%",
                padding: "7px 8px",
                borderRadius: 6,
                border: "1px solid #222",
                background: "#0a0a0a",
                color: clr,
                fontSize: 12,
                fontFamily: "'DM Mono',monospace",
                outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = clr)}
              onBlur={(e) => (e.target.style.borderColor = "#222")}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

const blankItem = () => ({
  id: uid("I"),
  partNumber: "",
  description: "",
  qty: "",
  raw: "",
  coated: "",
  defects: "",
  reworked: "",
});

function RunForm({ initial, knownParts, onSave, onCancel }) {
  const blank = {
    date: todayD(),
    time: nowT(),
    shift: "Morning",
    items: [blankItem()],
  };
  const [form, setForm] = useState(
    initial
      ? { ...initial, items: initial.items.map((it) => ({ ...it })) }
      : blank,
  );
  const setTop = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setItem = (i, val) =>
    setForm((f) => ({
      ...f,
      items: f.items.map((it, idx) => (idx === i ? val : it)),
    }));
  const addItem = () =>
    setForm((f) => ({ ...f, items: [...f.items, blankItem()] }));
  const remItem = (i) =>
    setForm((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const valid = form.items.every(
    (it) =>
      it.partNumber &&
      it.raw !== "" &&
      it.coated !== "" &&
      it.defects !== "" &&
      it.reworked !== "",
  );
  return (
    <div>
      <datalist id="part-list">
        {knownParts.map((p) => (
          <option key={p.partNumber} value={p.partNumber}>
            {p.description}
          </option>
        ))}
      </datalist>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <FInput
          label="Date"
          type="date"
          value={form.date}
          onChange={(v) => setTop("date", v)}
        />
        <FInput
          label="Time"
          type="time"
          value={form.time}
          onChange={(v) => setTop("time", v)}
        />
      </div>
      <div style={{ marginBottom: 18 }}>
        <label style={labelSt}>Shift</label>
        <div style={{ display: "flex", gap: 8 }}>
          {["Morning", "Afternoon"].map((s) => (
            <button
              key={s}
              onClick={() => setTop("shift", s)}
              style={{
                flex: 1,
                padding: "8px 0",
                borderRadius: 6,
                border: "1px solid",
                borderColor:
                  form.shift === s
                    ? s === "Morning"
                      ? "#c8ff00"
                      : "#00d4ff"
                    : "#222",
                background:
                  form.shift === s
                    ? s === "Morning"
                      ? "rgba(200,255,0,.08)"
                      : "rgba(0,212,255,.08)"
                    : "transparent",
                color:
                  form.shift === s
                    ? s === "Morning"
                      ? "#c8ff00"
                      : "#00d4ff"
                    : "#555",
                cursor: "pointer",
                fontSize: 12,
                fontFamily: "'DM Sans',sans-serif",
                transition: "all .15s",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div style={{ maxHeight: 320, overflowY: "auto", paddingRight: 4 }}>
        {form.items.map((item, i) => (
          <ItemRow
            key={item.id}
            item={item}
            index={i}
            knownParts={knownParts}
            onChange={(v) => setItem(i, v)}
            onRemove={() => remItem(i)}
            isOnly={form.items.length === 1}
          />
        ))}
      </div>
      <button
        onClick={addItem}
        style={{
          width: "100%",
          padding: "9px 0",
          borderRadius: 6,
          border: "1px dashed #222",
          background: "transparent",
          color: "#444",
          cursor: "pointer",
          fontSize: 11,
          fontFamily: "'DM Mono',monospace",
          margin: "6px 0 20px",
          transition: "all .15s",
        }}
        onMouseEnter={(e) => {
          e.target.style.borderColor = "#444";
          e.target.style.color = "#ccc";
        }}
        onMouseLeave={(e) => {
          e.target.style.borderColor = "#222";
          e.target.style.color = "#444";
        }}
      >
        + add part
      </button>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            padding: "10px 0",
            borderRadius: 6,
            border: "1px solid #222",
            background: "transparent",
            color: "#555",
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => valid && onSave(form)}
          style={{
            flex: 2,
            padding: "10px 0",
            borderRadius: 6,
            border: "none",
            background: valid ? "#c8ff00" : "#1a1a1a",
            color: valid ? "#0a0a0a" : "#333",
            cursor: valid ? "pointer" : "not-allowed",
            fontSize: 12,
            fontWeight: 500,
            fontFamily: "'DM Sans',sans-serif",
            transition: "all .15s",
          }}
        >
          Save Run
        </button>
      </div>
    </div>
  );
}

function DeleteConfirm({ label, onConfirm, onCancel }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>
        Delete{" "}
        <span style={{ color: "#e0e0e0", fontFamily: "'DM Mono',monospace" }}>
          {label}
        </span>
        ? This cannot be undone.
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            padding: "10px 0",
            borderRadius: 6,
            border: "1px solid #222",
            background: "transparent",
            color: "#555",
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          style={{
            flex: 2,
            padding: "10px 0",
            borderRadius: 6,
            border: "none",
            background: "#ff4d4d",
            color: "#fff",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// ─── User form (admin) ────────────────────────────────────────────────────────
function UserForm({ initial, onSave, onCancel }) {
  const blank = { name: "", email: "", password: "", role: ROLES.HANDLER };
  const [form, setForm] = useState(initial || blank);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const valid =
    form.name && form.email && (initial || form.password) && form.role;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FInput
          label="Full Name"
          value={form.name}
          onChange={(v) => set("name", v)}
          placeholder="Jane Doe"
        />
        <FInput
          label="Email"
          value={form.email}
          onChange={(v) => set("email", v)}
          placeholder="jane@company.com"
        />
      </div>
      <FInput
        label={initial ? "New Password (leave blank to keep)" : "Password"}
        type="password"
        value={form.password}
        onChange={(v) => set("password", v)}
        placeholder="••••••••"
      />
      <div>
        <label style={labelSt}>Role</label>
        <div style={{ display: "flex", gap: 8 }}>
          {Object.values(ROLES).map((r) => (
            <button
              key={r}
              onClick={() => set("role", r)}
              style={{
                flex: 1,
                padding: "8px 0",
                borderRadius: 6,
                border: "1px solid",
                borderColor: form.role === r ? ROLE_COLORS[r] : "#222",
                background:
                  form.role === r ? `${ROLE_COLORS[r]}14` : "transparent",
                color: form.role === r ? ROLE_COLORS[r] : "#555",
                cursor: "pointer",
                fontSize: 11,
                fontFamily: "'DM Sans',sans-serif",
                transition: "all .15s",
              }}
            >
              {ROLE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            padding: "10px 0",
            borderRadius: 6,
            border: "1px solid #222",
            background: "transparent",
            color: "#555",
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => valid && onSave(form)}
          style={{
            flex: 2,
            padding: "10px 0",
            borderRadius: 6,
            border: "none",
            background: valid ? "#c8ff00" : "#1a1a1a",
            color: valid ? "#0a0a0a" : "#333",
            cursor: valid ? "pointer" : "not-allowed",
            fontSize: 12,
            fontWeight: 500,
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          Save User
        </button>
      </div>
    </div>
  );
}

// ─── Login Page ───────────────────────────────────────────────────────────────
function LoginPage({ users, onLogin }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setError("");
    setLoading(true);
    setTimeout(() => {
      const user = users.find((u) => u.email === email && u.password === pass);
      if (user) {
        onLogin(user);
      } else {
        setError("Invalid email or password.");
        setLoading(false);
      }
    }, 600);
  };

  const handleKey = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans',sans-serif",
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');*{box-sizing:border-box;margin:0;padding:0;}`}</style>
      <div style={{ width: "100%", maxWidth: 380, padding: "0 24px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 500,
              color: "#e0e0e0",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontFamily: "'DM Mono',monospace",
            }}
          >
            ECOTRACK
          </div>
          <div
            style={{
              fontSize: 11,
              color: "#333",
              marginTop: 4,
              letterSpacing: "0.04em",
            }}
          >
            Select Finishing · Production Dashboard
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            background: "#0f0f0f",
            border: "1px solid #1a1a1a",
            borderRadius: 12,
            padding: "32px 28px",
          }}
        >
          <div
            style={{
              fontSize: 14,
              color: "#e0e0e0",
              fontWeight: 500,
              marginBottom: 24,
            }}
          >
            Sign in
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              marginBottom: 20,
            }}
          >
            <div>
              <label style={labelSt}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKey}
                placeholder="you@selectfinishing.com"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 7,
                  border: `1px solid ${error ? "#ff4d4d33" : "#1e1e1e"}`,
                  background: "#0a0a0a",
                  color: "#e0e0e0",
                  fontSize: 13,
                  fontFamily: "'DM Mono',monospace",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#444")}
                onBlur={(e) =>
                  (e.target.style.borderColor = error ? "#ff4d4d33" : "#1e1e1e")
                }
              />
            </div>
            <div>
              <label style={labelSt}>Password</label>
              <input
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                onKeyDown={handleKey}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 7,
                  border: `1px solid ${error ? "#ff4d4d33" : "#1e1e1e"}`,
                  background: "#0a0a0a",
                  color: "#e0e0e0",
                  fontSize: 13,
                  fontFamily: "'DM Mono',monospace",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#444")}
                onBlur={(e) =>
                  (e.target.style.borderColor = error ? "#ff4d4d33" : "#1e1e1e")
                }
              />
            </div>
          </div>

          {error && (
            <div
              style={{
                fontSize: 11,
                color: "#ff4d4d",
                fontFamily: "'DM Mono',monospace",
                marginBottom: 16,
                padding: "8px 12px",
                background: "rgba(255,77,77,.06)",
                borderRadius: 6,
                border: "1px solid rgba(255,77,77,.15)",
              }}
            >
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading || !email || !pass}
            style={{
              width: "100%",
              padding: "11px 0",
              borderRadius: 7,
              border: "none",
              background: !loading && email && pass ? "#c8ff00" : "#1a1a1a",
              color: !loading && email && pass ? "#0a0a0a" : "#333",
              cursor: !loading && email && pass ? "pointer" : "not-allowed",
              fontSize: 13,
              fontWeight: 500,
              fontFamily: "'DM Sans',sans-serif",
              transition: "all .15s",
            }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </div>

        {/* Demo hint */}
        <div
          style={{
            marginTop: 20,
            padding: "14px 16px",
            background: "#0d0d0d",
            border: "1px solid #141414",
            borderRadius: 8,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: "#2a2a2a",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontFamily: "'DM Mono',monospace",
              marginBottom: 10,
            }}
          >
            Demo accounts
          </div>
          {SEED_USERS.map((u) => (
            <div
              key={u.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
                cursor: "pointer",
              }}
              onClick={() => {
                setEmail(u.email);
                setPass(u.password);
                setError("");
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: "#444",
                  fontFamily: "'DM Mono',monospace",
                }}
              >
                {u.email}
              </span>
              <span
                style={{
                  fontSize: 10,
                  padding: "2px 7px",
                  borderRadius: 3,
                  background: `${ROLE_COLORS[u.role]}14`,
                  color: ROLE_COLORS[u.role],
                  fontFamily: "'DM Mono',monospace",
                }}
              >
                {ROLE_LABELS[u.role]}
              </span>
            </div>
          ))}
          <div
            style={{
              fontSize: 10,
              color: "#222",
              fontFamily: "'DM Mono',monospace",
              marginTop: 8,
            }}
          >
            Click any row to fill credentials
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [users, setUsers] = useState(SEED_USERS);
  const [runs, setRuns] = useState(SEED_RUNS);
  const [parts, setParts] = useState(SEED_PARTS);
  const [session, setSession] = useState(null); // logged-in user

  const [nav, setNav] = useState("Overview");
  const [shift, setShift] = useState("All");
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [toast, setToast] = useState(null);

  const showToast = (msg, color = "#c8ff00") => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 2600);
  };
  const closeModal = () => {
    setModal(null);
    setEditing(null);
    setDeleting(null);
  };
  const logout = () => {
    setSession(null);
    setNav("Overview");
  };

  // nav items gated by role
  const navItems = useMemo(() => {
    const items = ["Overview"];
    if (can.log(session)) items.push("Log");
    if (can.reports(session)) items.push("Reports");
    items.push("Parts");
    if (can.users(session)) items.push("Users");
    return items;
  }, [session]);

  // redirect if current nav becomes inaccessible
  useMemo(() => {
    if (!navItems.includes(nav)) setNav("Overview");
  }, [navItems]);

  const knownParts = useMemo(() => {
    const map = new Map(parts.map((p) => [p.partNumber, p]));
    runs.forEach((r) =>
      r.items.forEach((it) => {
        if (it.partNumber && !map.has(it.partNumber))
          map.set(it.partNumber, {
            partNumber: it.partNumber,
            description: it.description,
          });
      }),
    );
    return Array.from(map.values());
  }, [runs, parts]);

  const todayRuns = useMemo(
    () =>
      runs.filter(
        (r) => r.date === todayD() && (shift === "All" || r.shift === shift),
      ),
    [runs, shift],
  );
  const allItems = useMemo(
    () => todayRuns.flatMap((r) => r.items),
    [todayRuns],
  );
  const totals = useMemo(
    () => ({
      raw: allItems.reduce((s, it) => s + Number(it.raw), 0),
      coated: allItems.reduce((s, it) => s + Number(it.coated), 0),
      defects: allItems.reduce((s, it) => s + Number(it.defects), 0),
      reworked: allItems.reduce((s, it) => s + Number(it.reworked), 0),
    }),
    [allItems],
  );
  const defectRate = totals.raw
    ? ((totals.defects / totals.raw) * 100).toFixed(1)
    : "0.0";
  const yieldRate = totals.raw
    ? ((totals.coated / totals.raw) * 100).toFixed(1)
    : "0.0";
  const reworkSuccess = totals.defects
    ? ((totals.reworked / totals.defects) * 100).toFixed(0)
    : "0";

  const syncParts = (items) =>
    setParts((prev) => {
      const map = new Map(prev.map((p) => [p.partNumber, p]));
      items.forEach((it) => {
        if (it.partNumber && !map.has(it.partNumber))
          map.set(it.partNumber, {
            partNumber: it.partNumber,
            description: it.description,
          });
      });
      return Array.from(map.values());
    });

  // CRUD — runs
  const handleAddRun = (form) => {
    const r = {
      ...form,
      id: uid("R"),
      loggedBy: session.id,
      items: form.items.map((it) => ({
        ...it,
        id: uid("I"),
        qty: +it.qty,
        raw: +it.raw,
        coated: +it.coated,
        defects: +it.defects,
        reworked: +it.reworked,
      })),
    };
    setRuns((p) => [r, ...p]);
    syncParts(r.items);
    closeModal();
    showToast(`Run ${r.id} added`);
  };
  const handleEditRun = (form) => {
    const r = {
      ...editing,
      ...form,
      items: form.items.map((it) => ({
        ...it,
        qty: +it.qty,
        raw: +it.raw,
        coated: +it.coated,
        defects: +it.defects,
        reworked: +it.reworked,
      })),
    };
    setRuns((p) => p.map((x) => (x.id === editing.id ? r : x)));
    syncParts(r.items);
    closeModal();
    showToast(`Run ${r.id} updated`, "#00d4ff");
  };
  const handleDelRun = () => {
    setRuns((p) => p.filter((r) => r.id !== deleting.id));
    closeModal();
    showToast("Run deleted", "#ff4d4d");
  };

  // CRUD — users (admin)
  const handleAddUser = (form) => {
    const u = { ...form, id: uid("U") };
    setUsers((p) => [...p, u]);
    closeModal();
    showToast("User added");
  };
  const handleEditUser = (form) => {
    setUsers((p) =>
      p.map((u) =>
        u.id === editing.id
          ? { ...u, ...form, password: form.password || u.password }
          : u,
      ),
    );
    closeModal();
    showToast("User updated", "#00d4ff");
  };
  const handleDelUser = () => {
    if (deleting.id === session.id) {
      showToast("Can't delete yourself", "#ff4d4d");
      closeModal();
      return;
    }
    setUsers((p) => p.filter((u) => u.id !== deleting.id));
    closeModal();
    showToast("User removed", "#ff4d4d");
  };
  const handleDelPart = () => {
    setParts((p) => p.filter((x) => x.partNumber !== deleting.partNumber));
    closeModal();
    showToast("Part removed", "#ff4d4d");
  };

  const toggleExpand = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }));
  const runLoggerName = (id) => users.find((u) => u.id === id)?.name || "—";

  const CARDS = [
    { label: "Raw Parts", key: "raw", sub: `Total incoming`, max: 3000 },
    {
      label: "Coated Parts",
      key: "coated",
      sub: `${yieldRate}% yield`,
      max: 3000,
    },
    { label: "Defects", key: "defects", sub: `${defectRate}% rate`, max: 300 },
    {
      label: "Defects Reworked",
      key: "reworked",
      sub: `${reworkSuccess}% fixed`,
      max: 300,
    },
  ];

  // ── not logged in ──────────────────────────────────────────────────────────
  if (!session)
    return (
      <LoginPage
        users={users}
        onLogin={(u) => {
          setSession(u);
          setNav("Overview");
        }}
      />
    );

  // ── dashboard ──────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "#e0e0e0",
        fontFamily: "'DM Sans',sans-serif",
        display: "flex",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-track{background:#111;} ::-webkit-scrollbar-thumb{background:#2a2a2a;border-radius:2px;}
        input[type=number]::-webkit-inner-spin-button{opacity:.4;}
        input[type=date]::-webkit-calendar-picker-indicator,input[type=time]::-webkit-calendar-picker-indicator{filter:invert(.4);cursor:pointer;}
        .nav-item{padding:8px 14px;border-radius:6px;cursor:pointer;font-size:13px;color:#555;transition:all .15s;white-space:nowrap;}
        .nav-item:hover{color:#ccc;background:#161616;} .nav-item.active{color:#e0e0e0;background:#1a1a1a;}
        .card{background:#0f0f0f;border:1px solid #1a1a1a;border-radius:10px;padding:20px 22px;transition:border-color .2s;}
        .card:hover{border-color:#2a2a2a;}
        .run-row{border-bottom:1px solid #111;transition:background .1s;}
        .run-row:hover{background:#0d0d0d;}
        .run-row:hover .row-act{opacity:1;}
        .row-act{opacity:0;transition:opacity .15s;display:flex;gap:4px;}
        .rbtn{background:none;border:none;cursor:pointer;font-size:11px;padding:3px 7px;border-radius:4px;font-family:'DM Sans',sans-serif;transition:all .12s;}
        .rbtn.e{color:#444;} .rbtn.e:hover{color:#00d4ff;background:rgba(0,212,255,.08);}
        .rbtn.d{color:#444;} .rbtn.d:hover{color:#ff4d4d;background:rgba(255,77,77,.08);}
        .add-btn{background:#c8ff00;color:#0a0a0a;border:none;padding:8px 18px;border-radius:6px;font-size:12px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;transition:opacity .15s;}
        .add-btn:hover{opacity:.85;}
        .filter-btn{padding:6px 12px;border-radius:5px;border:1px solid #1a1a1a;background:transparent;color:#555;font-size:11px;cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif;}
        .filter-btn.active{border-color:#2a2a2a;background:#161616;color:#ccc;}
        .tag{display:inline-block;padding:2px 8px;border-radius:3px;font-size:10px;font-family:'DM Mono',monospace;letter-spacing:.04em;}
        .status-dot{width:6px;height:6px;border-radius:50%;background:#c8ff00;animation:pulse 2s infinite;display:inline-block;margin-right:6px;}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        .expand-btn{background:none;border:none;cursor:pointer;color:#333;font-size:13px;padding:0 4px;transition:color .15s;line-height:1;}
        .expand-btn:hover{color:#888;}
        .sub-row{display:grid;grid-template-columns:24px 120px 1fr 70px 70px 70px 70px;gap:0;padding:8px 16px 8px 40px;font-size:11px;font-family:'DM Mono',monospace;border-bottom:1px solid #0d0d0d;background:#080808;}
        .sub-row.hdr{color:#2a2a2a;font-size:9px;letter-spacing:.08em;text-transform:uppercase;padding-top:6px;padding-bottom:6px;}
        .toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);padding:10px 20px;border-radius:8px;font-size:12px;font-family:'DM Mono',monospace;border:1px solid;background:#111;z-index:300;animation:fadeup .25s ease;pointer-events:none;white-space:nowrap;}
        @keyframes fadeup{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        .tbl-row{display:grid;padding:11px 20px;border-bottom:1px solid #111;font-size:12px;font-family:'DM Mono',monospace;transition:background .1s;}
        .tbl-row:hover{background:#0d0d0d;}
        .tbl-row:hover .row-act{opacity:1;}
        .tbl-hdr{color:#2a2a2a;font-size:10px;letter-spacing:.08em;text-transform:uppercase;border-bottom:1px solid #1a1a1a;padding:9px 20px;}
        .logout-btn{background:none;border:none;color:#333;cursor:pointer;font-size:11px;font-family:'DM Sans',sans-serif;padding:6px 10px;border-radius:5px;transition:all .15s;width:100%;text-align:left;}
        .logout-btn:hover{color:#ff4d4d;background:rgba(255,77,77,.06);}
        .badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:3px;font-size:10px;font-family:'DM Mono',monospace;letter-spacing:.04em;}
      `}</style>

      {/* ── Sidebar ── */}
      <aside
        style={{
          width: 200,
          minHeight: "100vh",
          background: "#0a0a0a",
          borderRight: "1px solid #141414",
          display: "flex",
          flexDirection: "column",
          padding: "28px 16px",
          gap: 4,
          flexShrink: 0,
        }}
      >
        <div style={{ marginBottom: 32, paddingLeft: 14 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "#e0e0e0",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              fontFamily: "'DM Mono',monospace",
            }}
          >
            ECOTRACK
          </div>
          <div style={{ fontSize: 10, color: "#333", marginTop: 2 }}>
            Select Finishing
          </div>
        </div>
        {navItems.map((item) => (
          <div
            key={item}
            className={`nav-item ${nav === item ? "active" : ""}`}
            onClick={() => setNav(item)}
          >
            {item}
          </div>
        ))}
        <div style={{ flex: 1 }} />
        {/* user info */}
        <div style={{ paddingTop: 16, borderTop: "1px solid #141414" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              paddingLeft: 4,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "#1e1e1e",
                border: "1px solid #2a2a2a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                color: "#555",
                flexShrink: 0,
              }}
            >
              {session.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#ccc" }}>{session.name}</div>
              <span
                className="badge"
                style={{
                  background: `${ROLE_COLORS[session.role]}14`,
                  color: ROLE_COLORS[session.role],
                  marginTop: 2,
                }}
              >
                {ROLE_LABELS[session.role]}
              </span>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}>
            ← Sign out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, padding: "32px 36px", overflowY: "auto" }}>
        {/* ══ OVERVIEW ══ */}
        {nav === "Overview" && (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 32,
              }}
            >
              <div>
                <h1
                  style={{
                    fontSize: 18,
                    fontWeight: 400,
                    color: "#e0e0e0",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Production Overview
                </h1>
                <div
                  style={{
                    fontSize: 12,
                    color: "#3a3a3a",
                    marginTop: 4,
                    fontFamily: "'DM Mono',monospace",
                  }}
                >
                  <span className="status-dot" />
                  Live · {todayD()}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {["All", "Morning", "Afternoon"].map((s) => (
                  <button
                    key={s}
                    className={`filter-btn ${shift === s ? "active" : ""}`}
                    onClick={() => setShift(s)}
                  >
                    {s}
                  </button>
                ))}
                {can.log(session) && (
                  <button
                    className="add-btn"
                    onClick={() => setModal("add-run")}
                  >
                    + Log Run
                  </button>
                )}
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                gap: 12,
                marginBottom: 28,
              }}
            >
              {CARDS.map((c) => (
                <div key={c.key} className="card">
                  <div
                    style={{
                      fontSize: 10,
                      color: "#3a3a3a",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      fontFamily: "'DM Mono',monospace",
                      marginBottom: 10,
                    }}
                  >
                    {c.label}
                  </div>
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 300,
                      color: COLORS[c.key],
                      letterSpacing: "-0.02em",
                      lineHeight: 1,
                    }}
                  >
                    {totals[c.key].toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: "#3a3a3a", marginTop: 6 }}>
                    {c.sub}
                  </div>
                  <Sparkbar
                    value={totals[c.key]}
                    max={c.max}
                    color={COLORS[c.key]}
                  />
                </div>
              ))}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 270px",
                gap: 12,
              }}
            >
              <div
                style={{
                  background: "#0f0f0f",
                  border: "1px solid #1a1a1a",
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "14px 16px 12px",
                    borderBottom: "1px solid #141414",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{ fontSize: 12, color: "#555", fontWeight: 500 }}
                  >
                    Today's Runs
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: "#2a2a2a",
                      fontFamily: "'DM Mono',monospace",
                    }}
                  >
                    {todayRuns.length} runs · {allItems.length} parts
                  </span>
                </div>
                {todayRuns.length === 0 && (
                  <div
                    style={{
                      padding: "28px 16px",
                      textAlign: "center",
                      fontSize: 12,
                      color: "#222",
                      fontFamily: "'DM Mono',monospace",
                    }}
                  >
                    No runs logged today
                  </div>
                )}
                {todayRuns.map((run) => (
                  <div key={run.id} className="run-row">
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "28px 70px 56px 100px 1fr auto",
                        gap: 0,
                        padding: "11px 16px",
                        alignItems: "center",
                      }}
                    >
                      <button
                        className="expand-btn"
                        onClick={() => toggleExpand(run.id)}
                      >
                        {expanded[run.id] ? "▾" : "▸"}
                      </button>
                      <span
                        style={{
                          fontSize: 12,
                          color: "#3a3a3a",
                          fontFamily: "'DM Mono',monospace",
                        }}
                      >
                        {run.id}
                      </span>
                      <span>
                        <span
                          className="tag"
                          style={{
                            background:
                              run.shift === "Morning"
                                ? "rgba(200,255,0,.07)"
                                : "rgba(0,212,255,.07)",
                            color:
                              run.shift === "Morning" ? "#c8ff00" : "#00d4ff",
                          }}
                        >
                          {run.shift === "Morning" ? "AM" : "PM"}
                        </span>
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "#333",
                          fontFamily: "'DM Mono',monospace",
                        }}
                      >
                        {runLoggerName(run.loggedBy)}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "#444",
                          fontFamily: "'DM Mono',monospace",
                        }}
                      >
                        {run.time} · {run.items.length} part
                        {run.items.length !== 1 ? "s" : ""}
                      </span>
                      {can.editDelete(session) && (
                        <span className="row-act">
                          <button
                            className="rbtn e"
                            onClick={() => {
                              setEditing(run);
                              setModal("edit-run");
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="rbtn d"
                            onClick={() => {
                              setDeleting(run);
                              setModal("del-run");
                            }}
                          >
                            Del
                          </button>
                        </span>
                      )}
                    </div>
                    {expanded[run.id] && (
                      <>
                        <div className="sub-row hdr">
                          <span />
                          <span>Part #</span>
                          <span>Description</span>
                          <span style={{ textAlign: "right" }}>Raw</span>
                          <span style={{ textAlign: "right" }}>Coated</span>
                          <span style={{ textAlign: "right" }}>Defects</span>
                          <span style={{ textAlign: "right" }}>Reworked</span>
                        </div>
                        {run.items.map((it) => (
                          <div key={it.id} className="sub-row">
                            <span />
                            <span style={{ color: "#c8ff00" }}>
                              {it.partNumber}
                            </span>
                            <span style={{ color: "#555" }}>
                              {it.description}
                            </span>
                            <span
                              style={{ color: COLORS.raw, textAlign: "right" }}
                            >
                              {it.raw}
                            </span>
                            <span
                              style={{
                                color: COLORS.coated,
                                textAlign: "right",
                              }}
                            >
                              {it.coated}
                            </span>
                            <span
                              style={{
                                color: COLORS.defects,
                                textAlign: "right",
                              }}
                            >
                              {it.defects}
                            </span>
                            <span
                              style={{
                                color: COLORS.reworked,
                                textAlign: "right",
                              }}
                            >
                              {it.reworked}
                            </span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                ))}
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <div
                  style={{
                    background: "#0f0f0f",
                    border: "1px solid #1a1a1a",
                    borderRadius: 10,
                    padding: "18px 18px 14px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: "#555",
                      marginBottom: 16,
                      fontWeight: 500,
                    }}
                  >
                    Weekly Trend
                  </div>
                  <TrendChart runs={runs} />
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      marginTop: 14,
                      flexWrap: "wrap",
                    }}
                  >
                    {[
                      ["#c8ff00", "Raw"],
                      ["#00d4ff", "Coated"],
                      ["#ff4d4d", "Defects"],
                      ["#ff9800", "Reworked"],
                    ].map(([c, l]) => (
                      <div
                        key={l}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 1,
                            background: c,
                          }}
                        />
                        <span
                          style={{
                            fontSize: 10,
                            color: "#3a3a3a",
                            fontFamily: "'DM Mono',monospace",
                          }}
                        >
                          {l}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div
                  style={{
                    background: "#0f0f0f",
                    border: "1px solid #1a1a1a",
                    borderRadius: 10,
                    padding: 18,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: "#555",
                      marginBottom: 14,
                      fontWeight: 500,
                    }}
                  >
                    Shift Summary
                  </div>
                  {[
                    {
                      label: "Defect Rate",
                      value: `${defectRate}%`,
                      color: +defectRate > 5 ? "#ff4d4d" : "#c8ff00",
                    },
                    {
                      label: "Yield Rate",
                      value: `${yieldRate}%`,
                      color: "#00d4ff",
                    },
                    {
                      label: "Rework Fix %",
                      value: `${reworkSuccess}%`,
                      color: "#ff9800",
                    },
                    {
                      label: "Known Parts",
                      value: knownParts.length,
                      color: "#555",
                    },
                  ].map(({ label, value, color }) => (
                    <div
                      key={label}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 10,
                      }}
                    >
                      <span style={{ fontSize: 11, color: "#3a3a3a" }}>
                        {label}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          fontFamily: "'DM Mono',monospace",
                          color,
                          fontWeight: 500,
                        }}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══ LOG ══ */}
        {nav === "Log" && (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 28,
              }}
            >
              <div>
                <h1 style={{ fontSize: 18, fontWeight: 400, color: "#e0e0e0" }}>
                  Production Log
                </h1>
                <div
                  style={{
                    fontSize: 12,
                    color: "#3a3a3a",
                    marginTop: 4,
                    fontFamily: "'DM Mono',monospace",
                  }}
                >
                  {runs.length} runs total
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {["All", "Morning", "Afternoon"].map((s) => (
                  <button
                    key={s}
                    className={`filter-btn ${shift === s ? "active" : ""}`}
                    onClick={() => setShift(s)}
                  >
                    {s}
                  </button>
                ))}
                {can.log(session) && (
                  <button
                    className="add-btn"
                    onClick={() => setModal("add-run")}
                  >
                    + Log Run
                  </button>
                )}
              </div>
            </div>
            <div
              style={{
                background: "#0f0f0f",
                border: "1px solid #1a1a1a",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              {runs
                .filter((r) => shift === "All" || r.shift === shift)
                .sort(
                  (a, b) =>
                    b.date.localeCompare(a.date) ||
                    b.time.localeCompare(a.time),
                )
                .map((run) => (
                  <div key={run.id} className="run-row">
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "28px 70px 100px 56px 100px 1fr auto",
                        gap: 0,
                        padding: "11px 16px",
                        alignItems: "center",
                      }}
                    >
                      <button
                        className="expand-btn"
                        onClick={() => toggleExpand(run.id)}
                      >
                        {expanded[run.id] ? "▾" : "▸"}
                      </button>
                      <span
                        style={{
                          fontSize: 12,
                          color: "#3a3a3a",
                          fontFamily: "'DM Mono',monospace",
                        }}
                      >
                        {run.id}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "#444",
                          fontFamily: "'DM Mono',monospace",
                        }}
                      >
                        {run.date}
                      </span>
                      <span>
                        <span
                          className="tag"
                          style={{
                            background:
                              run.shift === "Morning"
                                ? "rgba(200,255,0,.07)"
                                : "rgba(0,212,255,.07)",
                            color:
                              run.shift === "Morning" ? "#c8ff00" : "#00d4ff",
                          }}
                        >
                          {run.shift === "Morning" ? "AM" : "PM"}
                        </span>
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "#333",
                          fontFamily: "'DM Mono',monospace",
                        }}
                      >
                        {runLoggerName(run.loggedBy)}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "#444",
                          fontFamily: "'DM Mono',monospace",
                        }}
                      >
                        {run.time} · {run.items.length} part
                        {run.items.length !== 1 ? "s" : ""}
                      </span>
                      {can.editDelete(session) && (
                        <span className="row-act">
                          <button
                            className="rbtn e"
                            onClick={() => {
                              setEditing(run);
                              setModal("edit-run");
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="rbtn d"
                            onClick={() => {
                              setDeleting(run);
                              setModal("del-run");
                            }}
                          >
                            Del
                          </button>
                        </span>
                      )}
                    </div>
                    {expanded[run.id] && (
                      <>
                        <div className="sub-row hdr">
                          <span />
                          <span>Part #</span>
                          <span>Description</span>
                          <span style={{ textAlign: "right" }}>Raw</span>
                          <span style={{ textAlign: "right" }}>Coated</span>
                          <span style={{ textAlign: "right" }}>Defects</span>
                          <span style={{ textAlign: "right" }}>Reworked</span>
                        </div>
                        {run.items.map((it) => (
                          <div key={it.id} className="sub-row">
                            <span />
                            <span style={{ color: "#c8ff00" }}>
                              {it.partNumber}
                            </span>
                            <span style={{ color: "#555" }}>
                              {it.description}
                            </span>
                            <span
                              style={{ color: COLORS.raw, textAlign: "right" }}
                            >
                              {it.raw}
                            </span>
                            <span
                              style={{
                                color: COLORS.coated,
                                textAlign: "right",
                              }}
                            >
                              {it.coated}
                            </span>
                            <span
                              style={{
                                color: COLORS.defects,
                                textAlign: "right",
                              }}
                            >
                              {it.defects}
                            </span>
                            <span
                              style={{
                                color: COLORS.reworked,
                                textAlign: "right",
                              }}
                            >
                              {it.reworked}
                            </span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                ))}
              {runs.filter((r) => shift === "All" || r.shift === shift)
                .length === 0 && (
                <div
                  style={{
                    padding: "28px 16px",
                    textAlign: "center",
                    fontSize: 12,
                    color: "#222",
                    fontFamily: "'DM Mono',monospace",
                  }}
                >
                  No runs
                </div>
              )}
            </div>
          </>
        )}

        {/* ══ REPORTS (supervisor+) ══ */}
        {nav === "Reports" && (
          <>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 18, fontWeight: 400, color: "#e0e0e0" }}>
                Reports
              </h1>
              <div
                style={{
                  fontSize: 12,
                  color: "#3a3a3a",
                  marginTop: 4,
                  fontFamily: "'DM Mono',monospace",
                }}
              >
                All-time · {runs.length} runs
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                gap: 12,
                marginBottom: 20,
              }}
            >
              {[
                ["Raw", COLORS.raw, "raw"],
                ["Coated", COLORS.coated, "coated"],
                ["Defects", COLORS.defects, "defects"],
                ["Reworked", COLORS.reworked, "reworked"],
              ].map(([lbl, clr, k]) => (
                <div key={k} className="card">
                  <div
                    style={{
                      fontSize: 10,
                      color: "#3a3a3a",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      fontFamily: "'DM Mono',monospace",
                      marginBottom: 10,
                    }}
                  >
                    Total {lbl}
                  </div>
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 300,
                      color: clr,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {runs
                      .flatMap((r) => r.items)
                      .reduce((s, it) => s + Number(it[k]), 0)
                      .toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
            {["Morning", "Afternoon"].map((s) => {
              const sItems = runs
                .filter((r) => r.shift === s)
                .flatMap((r) => r.items);
              const t = {
                raw: sItems.reduce((a, it) => a + it.raw, 0),
                coated: sItems.reduce((a, it) => a + it.coated, 0),
                defects: sItems.reduce((a, it) => a + it.defects, 0),
                reworked: sItems.reduce((a, it) => a + it.reworked, 0),
              };
              const dr = t.raw ? ((t.defects / t.raw) * 100).toFixed(1) : "0.0";
              const yr = t.raw ? ((t.coated / t.raw) * 100).toFixed(1) : "0.0";
              return (
                <div
                  key={s}
                  style={{
                    background: "#0f0f0f",
                    border: "1px solid #1a1a1a",
                    borderRadius: 10,
                    padding: 20,
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 16,
                    }}
                  >
                    <span
                      style={{ fontSize: 13, color: "#ccc", fontWeight: 500 }}
                    >
                      {s} Shift
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        color: "#333",
                        fontFamily: "'DM Mono',monospace",
                      }}
                    >
                      {runs.filter((r) => r.shift === s).length} runs
                    </span>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4,1fr)",
                      gap: 12,
                      marginBottom: 14,
                    }}
                  >
                    {["raw", "coated", "defects", "reworked"].map((k) => (
                      <div key={k}>
                        <div
                          style={{
                            fontSize: 10,
                            color: "#333",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            fontFamily: "'DM Mono',monospace",
                          }}
                        >
                          {k}
                        </div>
                        <div
                          style={{
                            fontSize: 22,
                            fontWeight: 300,
                            color: COLORS[k],
                            marginTop: 6,
                          }}
                        >
                          {t[k]}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      paddingTop: 14,
                      borderTop: "1px solid #141414",
                      display: "flex",
                      gap: 24,
                    }}
                  >
                    <span style={{ fontSize: 11, color: "#3a3a3a" }}>
                      Yield{" "}
                      <span
                        style={{
                          color: "#00d4ff",
                          fontFamily: "'DM Mono',monospace",
                        }}
                      >
                        {yr}%
                      </span>
                    </span>
                    <span style={{ fontSize: 11, color: "#3a3a3a" }}>
                      Defect Rate{" "}
                      <span
                        style={{
                          color: +dr > 5 ? "#ff4d4d" : "#c8ff00",
                          fontFamily: "'DM Mono',monospace",
                        }}
                      >
                        {dr}%
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ══ PARTS ══ */}
        {nav === "Parts" && (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 28,
              }}
            >
              <div>
                <h1 style={{ fontSize: 18, fontWeight: 400, color: "#e0e0e0" }}>
                  Parts Library
                </h1>
                <div
                  style={{
                    fontSize: 12,
                    color: "#3a3a3a",
                    marginTop: 4,
                    fontFamily: "'DM Mono',monospace",
                  }}
                >
                  {knownParts.length} parts
                </div>
              </div>
            </div>
            <div
              style={{
                background: "#0f0f0f",
                border: "1px solid #1a1a1a",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              <div
                className="tbl-row tbl-hdr"
                style={{ gridTemplateColumns: "130px 1fr 80px" }}
              >
                <span>Part #</span>
                <span>Description</span>
                <span />
              </div>
              {knownParts.map((p) => (
                <div
                  key={p.partNumber}
                  className="tbl-row"
                  style={{ gridTemplateColumns: "130px 1fr 80px" }}
                >
                  <span style={{ color: "#c8ff00" }}>{p.partNumber}</span>
                  <span style={{ color: "#888" }}>{p.description || "—"}</span>
                  {can.users(session) && (
                    <span
                      className="row-act"
                      style={{ justifyContent: "flex-end" }}
                    >
                      <button
                        className="rbtn d"
                        onClick={() => {
                          setDeleting(p);
                          setModal("del-part");
                        }}
                      >
                        Del
                      </button>
                    </span>
                  )}
                </div>
              ))}
              {knownParts.length === 0 && (
                <div
                  style={{
                    padding: "28px 20px",
                    fontSize: 12,
                    color: "#222",
                    fontFamily: "'DM Mono',monospace",
                  }}
                >
                  No parts yet
                </div>
              )}
            </div>
          </>
        )}

        {/* ══ USERS (admin only) ══ */}
        {nav === "Users" && (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 28,
              }}
            >
              <div>
                <h1 style={{ fontSize: 18, fontWeight: 400, color: "#e0e0e0" }}>
                  User Management
                </h1>
                <div
                  style={{
                    fontSize: 12,
                    color: "#3a3a3a",
                    marginTop: 4,
                    fontFamily: "'DM Mono',monospace",
                  }}
                >
                  {users.length} users
                </div>
              </div>
              <button className="add-btn" onClick={() => setModal("add-user")}>
                + Add User
              </button>
            </div>
            <div
              style={{
                background: "#0f0f0f",
                border: "1px solid #1a1a1a",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              <div
                className="tbl-row tbl-hdr"
                style={{ gridTemplateColumns: "1fr 1fr 120px 80px" }}
              >
                <span>Name</span>
                <span>Email</span>
                <span>Role</span>
                <span />
              </div>
              {users.map((u) => (
                <div
                  key={u.id}
                  className="tbl-row"
                  style={{
                    gridTemplateColumns: "1fr 1fr 120px 80px",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      color: u.id === session.id ? "#e0e0e0" : "#888",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {u.name}
                    {u.id === session.id && (
                      <span
                        style={{
                          fontSize: 9,
                          color: "#333",
                          fontFamily: "'DM Mono',monospace",
                        }}
                      >
                        (you)
                      </span>
                    )}
                  </span>
                  <span style={{ color: "#555" }}>{u.email}</span>
                  <span>
                    <span
                      className="badge"
                      style={{
                        background: `${ROLE_COLORS[u.role]}14`,
                        color: ROLE_COLORS[u.role],
                      }}
                    >
                      {ROLE_LABELS[u.role]}
                    </span>
                  </span>
                  <span
                    className="row-act"
                    style={{ justifyContent: "flex-end" }}
                  >
                    <button
                      className="rbtn e"
                      onClick={() => {
                        setEditing(u);
                        setModal("edit-user");
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="rbtn d"
                      onClick={() => {
                        setDeleting(u);
                        setModal("del-user");
                      }}
                    >
                      Del
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* ── Modals ── */}
      {modal === "add-run" && (
        <Modal title="Log Production Run" onClose={closeModal} wide>
          <RunForm
            knownParts={knownParts}
            onSave={handleAddRun}
            onCancel={closeModal}
          />
        </Modal>
      )}
      {modal === "edit-run" && editing && (
        <Modal title={`Edit Run ${editing.id}`} onClose={closeModal} wide>
          <RunForm
            initial={editing}
            knownParts={knownParts}
            onSave={handleEditRun}
            onCancel={closeModal}
          />
        </Modal>
      )}
      {modal === "del-run" && deleting && (
        <Modal title="Delete Run" onClose={closeModal}>
          <DeleteConfirm
            label={deleting.id}
            onConfirm={handleDelRun}
            onCancel={closeModal}
          />
        </Modal>
      )}
      {modal === "add-user" && (
        <Modal title="Add User" onClose={closeModal}>
          <UserForm onSave={handleAddUser} onCancel={closeModal} />
        </Modal>
      )}
      {modal === "edit-user" && editing && (
        <Modal title={`Edit ${editing.name}`} onClose={closeModal}>
          <UserForm
            initial={editing}
            onSave={handleEditUser}
            onCancel={closeModal}
          />
        </Modal>
      )}
      {modal === "del-user" && deleting && (
        <Modal title="Remove User" onClose={closeModal}>
          <DeleteConfirm
            label={deleting.name}
            onConfirm={handleDelUser}
            onCancel={closeModal}
          />
        </Modal>
      )}
      {modal === "del-part" && deleting && (
        <Modal title="Remove Part" onClose={closeModal}>
          <DeleteConfirm
            label={deleting.partNumber}
            onConfirm={handleDelPart}
            onCancel={closeModal}
          />
        </Modal>
      )}

      {toast && (
        <div
          className="toast"
          style={{ color: toast.color, borderColor: `${toast.color}33` }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
