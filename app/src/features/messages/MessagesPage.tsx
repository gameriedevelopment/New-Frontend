import { AlertCircle, MessageSquare, MessageSquarePlus, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, StatePanel } from "../../components/ui";
import { ConversationList } from "./components/ConversationList";
import { MessageThread } from "./components/MessageThread";
import { NewConversationDialog } from "./components/NewConversationDialog";
import { flattenConversations, useConversationSearch, useConversationUnread, useConversations, useMessages } from "./hooks";
import type { MessageConversation } from "./types";

function useDebounced(value: string, delay = 280) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const timeout = window.setTimeout(() => setDebounced(value), delay); return () => window.clearTimeout(timeout); }, [delay, value]);
  return debounced;
}

export function MessagesPage() {
  const [params, setParams] = useSearchParams();
  const type: "user" | "team" = params.get("tab") === "team" ? "team" : "user";
  const selectedId = params.get("conversation");
  const [search, setSearch] = useState("");
  const [newConversationOpen, setNewConversationOpen] = useState(false);
  const [createdConversation, setCreatedConversation] = useState<MessageConversation | null>(null);
  const [viewport, setViewport] = useState<{ height: number; top: number } | null>(null);
  const debouncedSearch = useDebounced(search.trim());
  const conversationsQuery = useConversations(type);
  const searchQuery = useConversationSearch(debouncedSearch);
  const conversations = useMemo(() => {
    const source = debouncedSearch.length >= 2 ? searchQuery.data ?? [] : flattenConversations(conversationsQuery.data);
    return source.filter((conversation) => type === "user" ? conversation.type === "user" : conversation.type !== "user");
  }, [conversationsQuery.data, debouncedSearch, searchQuery.data, type]);
  const selected = conversations.find((conversation) => conversation.id === selectedId) ?? flattenConversations(conversationsQuery.data).find((conversation) => conversation.id === selectedId) ?? (createdConversation?.id === selectedId ? createdConversation : null);
  const messagesQuery = useMessages(selected?.id);
  const unreadQuery = useConversationUnread(selected?.id);
  const messages = messagesQuery.data?.pages.flatMap((page) => page.data).reverse() ?? [];

  useEffect(() => {
    if (selectedId || !conversations.length || window.matchMedia("(max-width: 760px)").matches) return;
    setParams({ tab: type, conversation: conversations[0].id }, { replace: true });
  }, [conversations, selectedId, setParams, type]);

  useEffect(() => {
    const visualViewport = window.visualViewport;
    if (!visualViewport) return;
    const update = () => setViewport({ height: visualViewport.height, top: visualViewport.offsetTop });
    update();
    visualViewport.addEventListener("resize", update);
    visualViewport.addEventListener("scroll", update);
    return () => {
      visualViewport.removeEventListener("resize", update);
      visualViewport.removeEventListener("scroll", update);
    };
  }, []);

  const select = (id: string) => setParams({ tab: type, conversation: id }, { replace: true });
  const switchType = (next: "user" | "team") => { setSearch(""); setParams({ tab: next }, { replace: true }); };
  const created = (conversation: MessageConversation, tab: "user" | "team") => { setCreatedConversation(conversation); setNewConversationOpen(false); setSearch(""); setParams({ tab, conversation: conversation.id }, { replace: true }); };

  return <div className="messages-page" data-thread-open={Boolean(selectedId) || undefined} style={viewport ? { "--messages-viewport-height": `${viewport.height}px`, "--messages-viewport-top": `${viewport.top}px` } as React.CSSProperties : undefined}>
    <aside className="messages-sidebar">
      <header><div><p>Communication</p><h1>Messages</h1></div><button type="button" onClick={() => setNewConversationOpen(true)} aria-label="Start a conversation" title="Start a conversation"><MessageSquarePlus size={17} /></button></header>
      <nav aria-label="Conversation type"><button type="button" className={type === "user" ? "is-active" : undefined} onClick={() => switchType("user")} aria-pressed={type === "user"}>Direct</button><button type="button" className={type === "team" ? "is-active" : undefined} onClick={() => switchType("team")} aria-pressed={type === "team"}>Teams</button></nav>
      {conversationsQuery.isError && !debouncedSearch ? <StatePanel tone="error" icon={<AlertCircle size={18} />} title="Conversations could not load" description="Gamerie could not reach your messages right now." action={<Button size="small" variant="quiet" onClick={() => conversationsQuery.refetch()}><RefreshCw size={14} />Retry</Button>} /> : <ConversationList conversations={conversations} loading={conversationsQuery.isLoading || searchQuery.isFetching} search={search} onSearch={setSearch} selectedId={selectedId} onSelect={select} hasMore={Boolean(conversationsQuery.hasNextPage) && !debouncedSearch} fetchingMore={conversationsQuery.isFetchingNextPage} onLoadMore={() => conversationsQuery.fetchNextPage()} />}
    </aside>
    <section className="messages-workspace">
      {selected ? <MessageThread conversation={selected} messages={messages} unread={Number(unreadQuery.data ?? selected.unreadCount ?? 0)} loading={messagesQuery.isLoading} error={messagesQuery.isError} fetchingOlder={messagesQuery.isFetchingNextPage} hasOlder={Boolean(messagesQuery.hasNextPage)} onLoadOlder={() => messagesQuery.fetchNextPage()} onRetry={() => messagesQuery.refetch()} onBack={() => setParams({ tab: type }, { replace: true })} /> : <div className="messages-empty"><span><MessageSquare size={21} /></span><h2>Your conversations live here.</h2><p>Choose a player or team from the list to continue where you left off.</p></div>}
    </section>
    {newConversationOpen ? <NewConversationDialog onClose={() => setNewConversationOpen(false)} onCreated={created} /> : null}
  </div>;
}
