import { ArrowDown, ArrowUp, Lock, Minus, Plus, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Switch,
    Text,
    TextInput,
    View,
} from "react-native";
import {
    type PaperWidth,
    type PrinterConfig,
    type ReceiptSectionId,
} from "./printerConfig";

interface PrinterConfigModalProps {
  visible: boolean;
  config: PrinterConfig;
  onClose: () => void;
  onSave: (config: PrinterConfig) => void;
  onPrintTest?: () => void;
}

const MONO = Platform.select({
  android: "monospace",
  ios: "Courier",
  default: "monospace",
});
const SWITCH_TRACK = { false: "#D9D5C9", true: "#2E7D46" };

/* ------------------------------ small pieces ------------------------------ */

function SectionTitle({ children }: { children: string }) {
  return (
    <Text className="mb-2 mt-1 text-xs font-semibold uppercase tracking-wide text-[#6B6F68]">
      {children}
    </Text>
  );
}

function IconButton({
  icon: Icon,
  onPress,
  disabled,
  label,
}: {
  icon: typeof ArrowUp;
  onPress: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={`h-9 w-9 items-center justify-center rounded-full active:bg-[#F1EEE6] ${
        disabled ? "opacity-30" : ""
      }`}
    >
      <Icon size={18} color="#141813" />
    </Pressable>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View className="flex-row items-center gap-3 rounded-2xl bg-white px-4 py-3">
      <View className="flex-1">
        <Text className="text-sm font-semibold text-[#141813]">{label}</Text>
        {description ? (
          <Text className="text-xs text-[#6B6F68]">{description}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={SWITCH_TRACK}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View className="flex-row gap-1 rounded-full bg-[#F1EEE6] p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            className={`rounded-full px-4 py-1.5 ${active ? "bg-white shadow-sm" : ""}`}
          >
            <Text
              className={`text-xs font-semibold ${
                active ? "text-[#141813]" : "text-[#6B6F68]"
              }`}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ------------------------------ live preview ------------------------------ */

function PreviewText({
  children,
  center,
  bold,
}: {
  children: string;
  center?: boolean;
  bold?: boolean;
}) {
  return (
    <Text
      style={{
        fontFamily: MONO,
        fontSize: 11,
        lineHeight: 16,
        color: "#141813",
        textAlign: center ? "center" : "left",
        fontWeight: bold ? "700" : "400",
      }}
    >
      {children}
    </Text>
  );
}

function PreviewRow({
  left,
  right,
  bold,
}: {
  left: string;
  right: string;
  bold?: boolean;
}) {
  return (
    <View className="flex-row justify-between">
      <PreviewText bold={bold}>{left}</PreviewText>
      <PreviewText bold={bold}>{right}</PreviewText>
    </View>
  );
}

function ReceiptPreview({ config }: { config: PrinterConfig }) {
  const wide = config.paperWidth === 80;
  const dash = "-".repeat(wide ? 38 : 26);

  const renderSection = (id: ReceiptSectionId) => {
    switch (id) {
      case "logo":
        return (
          <View className="items-center py-1">
            <View className="h-10 w-24 items-center justify-center border border-[#141813]">
              <PreviewText center bold>
                LOGO
              </PreviewText>
            </View>
          </View>
        );
      case "storeInfo":
        return (
          <View>
            <PreviewText center bold>
              Kitchen & Cafe
            </PreviewText>
            <PreviewText center>123 Sample Street</PreviewText>
          </View>
        );
      case "header":
        return config.headerText.trim() ? (
          <PreviewText center>{config.headerText}</PreviewText>
        ) : null;
      case "orderInfo":
        return (
          <View>
            <PreviewText>Receipt #1042</PreviewText>
            <PreviewText>Oct 17, 2026 6:48 PM</PreviewText>
            <PreviewText>Cashier: Maria</PreviewText>
          </View>
        );
      case "customerInfo":
        return (
          <View>
            <PreviewText>Customer: Juan Dela Cruz</PreviewText>
            <PreviewText>0917 000 0000</PreviewText>
          </View>
        );
      case "items":
        return (
          <View>
            <PreviewRow left="2 x Latte" right="260.00" />
            {config.showItemComments ? (
              <PreviewText> * less sugar</PreviewText>
            ) : null}
            <PreviewRow left="1 x Club Sandwich" right="185.00" />
          </View>
        );
      case "totals":
        return (
          <View>
            <PreviewRow left="Subtotal" right="445.00" />
            <PreviewRow left="VAT (12%) incl." right="47.68" />
            <PreviewRow left="TOTAL" right="445.00" bold />
          </View>
        );
      case "payment":
        return (
          <View>
            <PreviewRow left="Cash" right="500.00" />
            <PreviewRow left="Change" right="55.00" />
          </View>
        );
      case "footer":
        return config.footerText.trim() ? (
          <PreviewText center>{config.footerText}</PreviewText>
        ) : null;
    }
  };

  const blocks = config.sections
    .filter((s) => s.enabled)
    .map((s) => ({ id: s.id, node: renderSection(s.id) }))
    .filter((b) => b.node !== null);

  return (
    <View
      style={{ width: wide ? 300 : 220 }}
      className="self-center rounded-md bg-white p-4 shadow-sm"
    >
      {blocks.map((b, i) => (
        <View key={b.id}>
          {b.node}
          {i < blocks.length - 1 ? (
            <Text
              numberOfLines={1}
              style={{ fontFamily: MONO, fontSize: 11, color: "#9A9A9A" }}
            >
              {dash}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

/* ---------------------------------- modal --------------------------------- */

export default function PrinterConfigModal({
  visible,
  config,
  onClose,
  onSave,
  onPrintTest,
}: PrinterConfigModalProps) {
  const [draft, setDraft] = useState<PrinterConfig>(config);

  // Start from the saved config every time the modal opens.
  useEffect(() => {
    if (visible) setDraft(config);
  }, [visible, config]);

  const patch = (changes: Partial<PrinterConfig>) =>
    setDraft((d) => ({ ...d, ...changes }));

  const toggleSection = (id: ReceiptSectionId, enabled: boolean) =>
    setDraft((d) => ({
      ...d,
      sections: d.sections.map((s) => (s.id === id ? { ...s, enabled } : s)),
    }));

  const moveSection = (index: number, dir: -1 | 1) =>
    setDraft((d) => {
      const target = index + dir;
      if (target < 0 || target >= d.sections.length) return d;
      const sections = [...d.sections];
      [sections[index], sections[target]] = [sections[target], sections[index]];
      return { ...d, sections };
    });

  const handleSave = () => {
    onSave(draft);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      supportedOrientations={["landscape", "portrait"]}
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-black/40 p-6">
        <View className="max-h-[92%] w-full max-w-[1000px] overflow-hidden rounded-3xl bg-[#FAF8F3]">
          {/* Top bar */}
          <View className="flex-row items-center justify-between border-b border-[#ECE8DC] px-6 py-4">
            <View>
              <Text className="text-xl font-bold text-[#141813]">
                Printer configuration
              </Text>
              <Text className="text-xs text-[#6B6F68]">
                Choose what the receipt prints and in what order.
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close"
              className="h-10 w-10 items-center justify-center rounded-full active:bg-[#F1EEE6]"
            >
              <X size={20} color="#141813" />
            </Pressable>
          </View>

          {/* Body: settings | preview */}
          <View className="flex-row">
            <ScrollView
              className="flex-[3]"
              contentContainerClassName="gap-2 p-6"
              keyboardShouldPersistTaps="handled"
            >
              <SectionTitle>Receipt layout (top to bottom)</SectionTitle>
              {draft.sections.map((s, i) => (
                <View
                  key={s.id}
                  className="flex-row items-center gap-3 rounded-2xl bg-white px-4 py-3"
                >
                  <Text className="w-5 text-center text-xs font-semibold text-[#6B6F68]">
                    {i + 1}
                  </Text>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-[#141813]">
                      {s.label}
                    </Text>
                    <Text className="text-xs text-[#6B6F68]">
                      {s.description}
                    </Text>
                  </View>
                  {s.locked ? (
                    <View className="w-[51px] items-center">
                      <Lock size={16} color="#6B6F68" />
                    </View>
                  ) : (
                    <Switch
                      value={s.enabled}
                      onValueChange={(v) => toggleSection(s.id, v)}
                      trackColor={SWITCH_TRACK}
                      thumbColor="#FFFFFF"
                    />
                  )}
                  <IconButton
                    icon={ArrowUp}
                    label={`Move ${s.label} up`}
                    disabled={i === 0}
                    onPress={() => moveSection(i, -1)}
                  />
                  <IconButton
                    icon={ArrowDown}
                    label={`Move ${s.label} down`}
                    disabled={i === draft.sections.length - 1}
                    onPress={() => moveSection(i, 1)}
                  />
                </View>
              ))}

              <SectionTitle>Custom text</SectionTitle>
              <View className="gap-3 rounded-2xl bg-white p-4">
                <View>
                  <Text className="mb-1 text-xs font-semibold text-[#6B6F68]">
                    Header
                  </Text>
                  <TextInput
                    value={draft.headerText}
                    onChangeText={(t) => patch({ headerText: t })}
                    placeholder="e.g. Open daily 7AM–9PM"
                    placeholderTextColor="#A8ABA3"
                    multiline
                    className="min-h-[44px] rounded-xl bg-[#FAF8F3] px-3 py-2 text-sm text-[#141813]"
                  />
                </View>
                <View>
                  <Text className="mb-1 text-xs font-semibold text-[#6B6F68]">
                    Footer
                  </Text>
                  <TextInput
                    value={draft.footerText}
                    onChangeText={(t) => patch({ footerText: t })}
                    placeholder="e.g. Thank you! Please come again."
                    placeholderTextColor="#A8ABA3"
                    multiline
                    className="min-h-[44px] rounded-xl bg-[#FAF8F3] px-3 py-2 text-sm text-[#141813]"
                  />
                </View>
              </View>

              <SectionTitle>Receipt options</SectionTitle>
              <ToggleRow
                label="Show item comments"
                description="Print notes added to items and tickets"
                value={draft.showItemComments}
                onChange={(v) => patch({ showItemComments: v })}
              />

              <SectionTitle>Printing</SectionTitle>
              <ToggleRow
                label="Print automatically after payment"
                value={draft.autoPrint}
                onChange={(v) => patch({ autoPrint: v })}
              />
              <ToggleRow
                label="Open cash drawer on cash sales"
                value={draft.openDrawerOnCash}
                onChange={(v) => patch({ openDrawerOnCash: v })}
              />
              <View className="flex-row items-center justify-between rounded-2xl bg-white px-4 py-3">
                <Text className="text-sm font-semibold text-[#141813]">
                  Copies
                </Text>
                <View className="flex-row items-center gap-2">
                  <IconButton
                    icon={Minus}
                    label="Fewer copies"
                    disabled={draft.copies <= 1}
                    onPress={() => patch({ copies: draft.copies - 1 })}
                  />
                  <Text className="w-6 text-center text-sm font-semibold text-[#141813]">
                    {draft.copies}
                  </Text>
                  <IconButton
                    icon={Plus}
                    label="More copies"
                    disabled={draft.copies >= 3}
                    onPress={() => patch({ copies: draft.copies + 1 })}
                  />
                </View>
              </View>
              <View className="flex-row items-center justify-between rounded-2xl bg-white px-4 py-3">
                <Text className="text-sm font-semibold text-[#141813]">
                  Paper width
                </Text>
                <Segmented<PaperWidth>
                  value={draft.paperWidth}
                  onChange={(v) => patch({ paperWidth: v })}
                  options={[
                    { value: 58, label: "58 mm" },
                    { value: 80, label: "80 mm" },
                  ]}
                />
              </View>
            </ScrollView>

            {/* Preview */}
            <ScrollView
              className="flex-[2] border-l border-[#ECE8DC] bg-[#F1EEE6]"
              contentContainerClassName="p-6"
            >
              <Text className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-[#6B6F68]">
                Preview
              </Text>
              <ReceiptPreview config={draft} />
            </ScrollView>
          </View>

          {/* Footer actions */}
          <View className="flex-row items-center justify-between gap-3 border-t border-[#ECE8DC] px-6 py-4">
            {onPrintTest ? (
              <Pressable
                onPress={onPrintTest}
                className="rounded-full border border-[#D9D5C9] px-5 py-2.5 active:bg-[#F1EEE6]"
              >
                <Text className="text-sm font-semibold text-[#141813]">
                  Print test receipt
                </Text>
              </Pressable>
            ) : (
              <View />
            )}
            <View className="flex-row gap-3">
              <Pressable
                onPress={onClose}
                className="rounded-full px-5 py-2.5 active:bg-[#F1EEE6]"
              >
                <Text className="text-sm font-semibold text-[#6B6F68]">
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                className="rounded-full bg-[#2E7D46] px-6 py-2.5 active:opacity-80"
              >
                <Text className="text-sm font-semibold text-white">Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
