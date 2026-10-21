import EmployeeFormModal from "@/components/inventory/employees/EmployeeFormModal";
import { Feather } from "@expo/vector-icons";
import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import {
  ApiError,
  Employee,
  EmploymentStatus,
  getEmployees,
} from "../../services/employeeApi";

const PAGE_SIZE = 8;

const STATUS_FILTERS = [
  "All Statuses",
  "Active",
  "Inactive",
  "Terminated",
] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const MONO = Platform.select({
  android: "monospace",
  ios: "Menlo",
  default: "monospace",
});

// Column flex ratios, shared by the header and every row so they line up.
const COL = {
  id: 1.1,
  name: 1.7,
  position: 2,
  phone: 1.5,
  hire: 1.2,
  status: 1.2,
  actions: 1,
};

const STATUS_STYLES: Record<
  EmploymentStatus,
  { bg: string; text: string; dot: string }
> = {
  Active: { bg: "bg-[#E3F4EA]", text: "text-[#1F7A4D]", dot: "bg-[#2FA56B]" },
  Inactive: { bg: "bg-[#FDF3DC]", text: "text-[#B7791F]", dot: "bg-[#E0A030]" },
  Terminated: {
    bg: "bg-[#ECEDEC]",
    text: "text-[#6B726C]",
    dot: "bg-[#9AA19B]",
  },
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// "2021-03-12" (or an ISO timestamp) -> "Mar 12, 2021"
function formatHireDate(value: string | null): string {
  if (!value) return "—";
  const [y, m, d] = value.slice(0, 10).split("-");
  const month = MONTHS[Number(m) - 1];
  if (!y || !month || !d) return value;
  return `${month} ${d}, ${y}`;
}

function Cell({
  flex,
  align = "flex-start",
  children,
}: {
  flex: number;
  align?: "flex-start" | "flex-end";
  children: ReactNode;
}) {
  return (
    <View style={{ flex, alignItems: align, paddingRight: 12 }}>
      {children}
    </View>
  );
}

function HeaderText({ children }: { children: string }) {
  return (
    <Text className="text-[11px] font-semibold tracking-widest text-[#8A918A]">
      {children}
    </Text>
  );
}

function StatusBadge({ status }: { status: EmploymentStatus | null }) {
  if (!status) return <Text className="text-sm text-[#8A918A]">—</Text>;
  const s = STATUS_STYLES[status];
  return (
    <View
      className={`flex-row items-center gap-1.5 self-start rounded-full px-2.5 py-1 ${s.bg}`}
    >
      <View className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      <Text className={`text-xs font-medium ${s.text}`}>{status}</Text>
    </View>
  );
}

// The menu opens in a transparent Modal because Android ignores touches on
// children that hang outside their parent's bounds.
function StatusDropdown({
  value,
  onChange,
}: {
  value: StatusFilter;
  onChange: (v: StatusFilter) => void;
}) {
  const ref = useRef<View>(null);
  const [anchor, setAnchor] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

  const open = () =>
    ref.current?.measureInWindow((x, y, w, h) => setAnchor({ x, y, w, h }));
  const close = () => setAnchor(null);

  return (
    <>
      <Pressable
        ref={ref}
        onPress={open}
        className="h-11 w-52 flex-row items-center justify-between rounded-xl border border-[#E4E7E4] bg-white px-4"
      >
        <Text className="text-sm text-[#2B332E]">{value}</Text>
        <Feather name="chevron-down" size={16} color="#6B726C" />
      </Pressable>

      <Modal
        transparent
        visible={anchor !== null}
        statusBarTranslucent
        animationType="fade"
        onRequestClose={close}
      >
        <Pressable className="flex-1" onPress={close}>
          {anchor && (
            <View
              style={{
                position: "absolute",
                left: anchor.x,
                top: anchor.y + anchor.h + 4,
                width: anchor.w,
                elevation: 8,
              }}
              className="rounded-xl border border-[#E4E7E4] bg-white py-1"
            >
              {STATUS_FILTERS.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => {
                    onChange(option);
                    close();
                  }}
                  className="flex-row items-center justify-between px-4 py-2.5 active:bg-[#F4F6F4]"
                >
                  <Text
                    className={`text-sm ${
                      option === value
                        ? "font-semibold text-[#1A3C2E]"
                        : "text-[#2B332E]"
                    }`}
                  >
                    {option}
                  </Text>
                  {option === value && (
                    <Feather name="check" size={14} color="#1A3C2E" />
                  )}
                </Pressable>
              ))}
            </View>
          )}
        </Pressable>
      </Modal>
    </>
  );
}

export default function EmployeeScreen() {
  const { signOut } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("All Statuses");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        setEmployees(await getEmployees());
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          // Token expired or revoked: end the local session.
          void signOut();
          return;
        }
        setError(e instanceof Error ? e.message : "Something went wrong.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [signOut],
  );

  useEffect(() => {
    load();
  }, [load]);

  // Search and filtering run on the client: the backend's ?search= currently
  // queries a `name` column that doesn't exist.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((e) => {
      if (
        statusFilter !== "All Statuses" &&
        e.employment_status !== statusFilter
      )
        return false;
      if (!q) return true;
      return [
        e.employee_id,
        `${e.first_name} ${e.last_name}`,
        e.position ?? "",
      ].some((v) => v.toLowerCase().includes(q));
    });
  }, [employees, search, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (e: Employee) => {
    setEditing(e);
    setModalOpen(true);
  };

  const renderRow = ({ item }: { item: Employee }) => (
    <View className="flex-row items-center border-b border-[#EEF0EE] px-6 py-4">
      <Cell flex={COL.id}>
        <View className="rounded-md bg-[#F0F1EF] px-2 py-1">
          <Text
            style={{ fontFamily: MONO }}
            className="text-[11px] font-bold text-[#2B332E]"
          >
            {item.employee_id}
          </Text>
        </View>
      </Cell>
      <Cell flex={COL.name}>
        <Text numberOfLines={1} className="text-sm font-bold text-[#111A14]">
          {item.first_name} {item.last_name}
        </Text>
      </Cell>
      <Cell flex={COL.position}>
        <Text numberOfLines={1} className="text-sm text-[#2B332E]">
          {item.position || "—"}
        </Text>
      </Cell>
      <Cell flex={COL.phone}>
        <Text style={{ fontFamily: MONO }} className="text-xs text-[#6B726C]">
          {item.phone_number || "—"}
        </Text>
      </Cell>
      <Cell flex={COL.hire}>
        <Text className="text-sm text-[#4B554E]">
          {formatHireDate(item.hire_date)}
        </Text>
      </Cell>
      <Cell flex={COL.status}>
        <StatusBadge status={item.employment_status} />
      </Cell>
      <Cell flex={COL.actions} align="flex-end">
        <Pressable
          onPress={() => openEdit(item)}
          className="flex-row items-center gap-2 rounded-lg border border-[#D9DDD9] bg-white px-3 py-2 active:bg-[#F4F6F4]"
        >
          <Feather name="edit" size={14} color="#2B332E" />
          <Text className="text-sm font-medium text-[#2B332E]">Update</Text>
        </Pressable>
      </Cell>
    </View>
  );

  const emptyState = loading ? (
    <View className="items-center py-20">
      <ActivityIndicator color="#1A3C2E" />
    </View>
  ) : error ? (
    <View className="items-center gap-3 py-20">
      <Feather name="alert-circle" size={24} color="#B91C1C" />
      <Text className="text-sm text-[#4B554E]">{error}</Text>
      <Pressable
        onPress={() => load()}
        className="rounded-lg border border-[#D9DDD9] px-4 py-2"
      >
        <Text className="text-sm font-medium text-[#2B332E]">Retry</Text>
      </Pressable>
    </View>
  ) : (
    <View className="items-center py-20">
      <Text className="text-sm text-[#8A918A]">No employees found.</Text>
    </View>
  );

  return (
    <View className="flex-1 gap-4 bg-[#F4F6F4] p-6">
      {/* Toolbar */}
      <View className="flex-row items-center gap-4 rounded-2xl border border-[#E4E7E4] bg-[#FBFAF7] p-3">
        <View className="h-11 flex-1 flex-row items-center gap-3 rounded-xl border border-[#E4E7E4] bg-[#F4F4F0] px-4">
          <Feather name="search" size={16} color="#8A918A" />
          <TextInput
            value={search}
            onChangeText={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search by employee ID, name, position..."
            placeholderTextColor="#9AA19B"
            className="flex-1 text-sm text-[#111A14]"
          />
        </View>

        <StatusDropdown
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        />

        <Pressable
          onPress={openAdd}
          className="h-11 flex-row items-center gap-2 rounded-xl bg-[#1A3C2E] px-5 active:opacity-90"
        >
          <Feather name="plus" size={16} color="#fff" />
          <Text className="text-sm font-semibold text-white">Add Employee</Text>
        </Pressable>
      </View>

      {/* Table */}
      <View className="flex-1 overflow-hidden rounded-2xl border border-[#E4E7E4] bg-white">
        <View className="flex-row items-center border-b border-[#E4E7E4] bg-[#FBFAF7] px-6 py-3">
          <Cell flex={COL.id}>
            <HeaderText>EMPLOYEE ID</HeaderText>
          </Cell>
          <Cell flex={COL.name}>
            <HeaderText>EMPLOYEE NAME</HeaderText>
          </Cell>
          <Cell flex={COL.position}>
            <HeaderText>POSITION</HeaderText>
          </Cell>
          <Cell flex={COL.phone}>
            <HeaderText>PHONE NUMBER</HeaderText>
          </Cell>
          <Cell flex={COL.hire}>
            <HeaderText>HIRE DATE</HeaderText>
          </Cell>
          <Cell flex={COL.status}>
            <HeaderText>STATUS</HeaderText>
          </Cell>
          <Cell flex={COL.actions} align="flex-end">
            <HeaderText>ACTIONS</HeaderText>
          </Cell>
        </View>

        <FlatList
          data={pageItems}
          keyExtractor={(item) => item.employee_id}
          renderItem={renderRow}
          ListEmptyComponent={emptyState}
          refreshing={refreshing}
          onRefresh={() => load(true)}
          className="flex-1"
        />

        {/* Footer */}
        <View className="flex-row items-center justify-between border-t border-[#E4E7E4] bg-[#FBFAF7] px-6 py-3">
          <Text className="text-xs text-[#8A918A]">
            Showing {pageItems.length} of {filtered.length} employees
          </Text>
          <View className="flex-row items-center gap-3">
            <Pressable
              disabled={currentPage <= 1}
              onPress={() => setPage(currentPage - 1)}
              className={`rounded-lg border border-[#E4E7E4] bg-white px-3 py-1.5 ${currentPage <= 1 ? "opacity-40" : ""}`}
            >
              <Text className="text-xs font-medium text-[#2B332E]">
                Previous
              </Text>
            </Pressable>
            <Text className="text-xs font-semibold text-[#111A14]">
              Page {currentPage} of {pageCount}
            </Text>
            <Pressable
              disabled={currentPage >= pageCount}
              onPress={() => setPage(currentPage + 1)}
              className={`rounded-lg border border-[#E4E7E4] bg-white px-3 py-1.5 ${currentPage >= pageCount ? "opacity-40" : ""}`}
            >
              <Text className="text-xs font-medium text-[#2B332E]">Next</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <EmployeeFormModal
        visible={modalOpen}
        employee={editing}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          setModalOpen(false);
          load(true);
        }}
      />
    </View>
  );
}
