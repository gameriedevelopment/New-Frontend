import { Search } from "lucide-react";
import { Skeleton, SkeletonAvatar, SkeletonText } from "../../../components/ui";
import type { MessageConversation } from "../types";
import { ConversationRow } from "./ConversationRow";

export function ConversationList({
  conversations,
  fetchingMore,
  hasMore,
  loading,
  onLoadMore,
  onSearch,
  onSelect,
  onDeleted,
  search,
  selectedId,
}: {
  conversations: MessageConversation[];
  fetchingMore: boolean;
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  onSearch: (value: string) => void;
  onSelect: (id: string) => void;
  onDeleted?: (id: string) => void;
  search: string;
  selectedId?: string | null;
}) {
  return (
    <div className="conversation-list">
      <label className="conversation-search">
        <Search size={15} />
        <span className="sr-only">Search conversations</span>
        <input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search conversations"
        />
      </label>
      <div className="conversation-list__scroll">
        {loading
          ? Array.from({ length: 7 }, (_, index) => (
              <div className="conversation-row-skeleton" key={index}>
                <SkeletonAvatar size={38} />
                <SkeletonText lines={2} />
              </div>
            ))
          : null}
        {!loading && !conversations.length ? (
          <div className="conversation-list__empty">
            <strong>{search ? "No matching conversations" : "No conversations yet"}</strong>
            <p>
              {search
                ? "Try another player or team name."
                : "Start a conversation when you are ready."}
            </p>
          </div>
        ) : null}
        {conversations.map((conversation) => (
          <ConversationRow
            key={conversation.id}
            conversation={conversation}
            selected={selectedId === conversation.id}
            onSelect={() => onSelect(conversation.id)}
            onDeleted={onDeleted}
          />
        ))}
        {fetchingMore ? (
          <div className="conversation-list__more" role="status">
            <Skeleton width="42%" height={8} />
          </div>
        ) : null}
        {hasMore && !fetchingMore ? (
          <button className="conversation-list__load" type="button" onClick={onLoadMore}>
            Load more conversations
          </button>
        ) : null}
      </div>
    </div>
  );
}
