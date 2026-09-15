import { useState } from "react";
import {
  View, Text, TouchableOpacity, Modal, FlatList,
  StyleSheet, TextInput, SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { REGIONS, getDistricts } from "@/lib/tanzania";
import { C } from "@/lib/colors";

interface LocationValue {
  region:   string;
  district: string;
  ward:     string;
}

interface Props {
  value:    LocationValue;
  onChange: (v: LocationValue) => void;
}

export function LocationPicker({ value, onChange }: Props) {
  const [showRegion,   setShowRegion]   = useState(false);
  const [showDistrict, setShowDistrict] = useState(false);
  const [regionSearch, setRegionSearch] = useState("");
  const [distSearch,   setDistSearch]   = useState("");

  const filteredRegions   = REGIONS.filter(r => r.toLowerCase().includes(regionSearch.toLowerCase()));
  const districts         = getDistricts(value.region);
  const filteredDistricts = districts.filter(d => d.toLowerCase().includes(distSearch.toLowerCase()));

  function selectRegion(r: string) {
    onChange({ region: r, district: "", ward: "" });
    setRegionSearch("");
    setShowRegion(false);
  }

  function selectDistrict(d: string) {
    onChange({ ...value, district: d, ward: "" });
    setDistSearch("");
    setShowDistrict(false);
  }

  return (
    <View style={{ gap: 12 }}>
      {/* Region */}
      <View>
        <Text style={s.label}>Region</Text>
        <TouchableOpacity style={s.selector} onPress={() => setShowRegion(true)}>
          <Text style={[s.selectorText, !value.region && s.placeholder]}>
            {value.region || "Select region…"}
          </Text>
          <Ionicons name="chevron-down" size={16} color={C.textMuted} />
        </TouchableOpacity>
      </View>

      {/* District — shown after region selected */}
      {value.region !== "" && (
        <View>
          <Text style={s.label}>District</Text>
          <TouchableOpacity style={s.selector} onPress={() => setShowDistrict(true)}>
            <Text style={[s.selectorText, !value.district && s.placeholder]}>
              {value.district || "Select district…"}
            </Text>
            <Ionicons name="chevron-down" size={16} color={C.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      {/* Ward — shown after district selected */}
      {value.district !== "" && (
        <View>
          <Text style={s.label}>
            Ward / Street{" "}
            <Text style={{ color: C.textMuted, fontWeight: "400" }}>(optional)</Text>
          </Text>
          <TextInput
            style={s.input}
            placeholder="e.g. Kariakoo, Msasani, Mikocheni…"
            placeholderTextColor={C.textMuted}
            value={value.ward}
            onChangeText={t => onChange({ ...value, ward: t })}
          />
        </View>
      )}

      {/* Region picker modal */}
      <PickerModal
        visible={showRegion}
        title="Select Region"
        items={filteredRegions}
        search={regionSearch}
        onSearch={setRegionSearch}
        onSelect={selectRegion}
        onClose={() => { setShowRegion(false); setRegionSearch(""); }}
      />

      {/* District picker modal */}
      <PickerModal
        visible={showDistrict}
        title={`Districts — ${value.region}`}
        items={filteredDistricts}
        search={distSearch}
        onSearch={setDistSearch}
        onSelect={selectDistrict}
        onClose={() => { setShowDistrict(false); setDistSearch(""); }}
      />
    </View>
  );
}

function PickerModal({
  visible, title, items, search, onSearch, onSelect, onClose,
}: {
  visible:  boolean;
  title:    string;
  items:    string[];
  search:   string;
  onSearch: (v: string) => void;
  onSelect: (v: string) => void;
  onClose:  () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={m.sheet}>
        {/* Header */}
        <View style={m.header}>
          <Text style={m.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={m.closeBtn}>
            <Ionicons name="close" size={22} color={C.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={m.searchWrap}>
          <Ionicons name="search-outline" size={16} color={C.textMuted} />
          <TextInput
            style={m.searchInput}
            placeholder="Search…"
            placeholderTextColor={C.textMuted}
            value={search}
            onChangeText={onSearch}
            autoFocus
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => onSearch("")}>
              <Ionicons name="close-circle" size={16} color={C.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* List */}
        <FlatList
          data={items}
          keyExtractor={item => item}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: C.border }} />}
          renderItem={({ item }) => (
            <TouchableOpacity style={m.item} onPress={() => onSelect(item)}>
              <Text style={m.itemText}>{item}</Text>
              <Ionicons name="chevron-forward" size={14} color={C.textMuted} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={{ padding: 24, alignItems: "center" }}>
              <Text style={{ color: C.textMuted, fontSize: 14 }}>No results found</Text>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  label:       { fontSize: 13, fontWeight: "600", color: C.textPrimary, marginBottom: 6 },
  selector:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 48, borderWidth: 1.5, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, backgroundColor: C.surface },
  selectorText:{ fontSize: 15, color: C.textPrimary, flex: 1 },
  placeholder: { color: C.textMuted },
  input:       { height: 48, borderWidth: 1.5, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, fontSize: 15, color: C.textPrimary, backgroundColor: C.surface },
});

const m = StyleSheet.create({
  sheet:       { flex: 1, backgroundColor: C.surface },
  header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  title:       { fontSize: 17, fontWeight: "700", color: C.textPrimary },
  closeBtn:    { padding: 4 },
  searchWrap:  { flexDirection: "row", alignItems: "center", gap: 10, margin: 12, backgroundColor: C.bg, borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: C.border },
  searchInput: { flex: 1, height: 42, fontSize: 14, color: C.textPrimary },
  item:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 15, paddingHorizontal: 20 },
  itemText:    { fontSize: 15, color: C.textPrimary },
});
