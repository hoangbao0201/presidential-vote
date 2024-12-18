import GroupVotingDetailTemplate from "@/components/modules/GroupVotingDetailTemplate";

export default function GroupVotingDetailPage({ params }: SearchParamProps) {
    const { id } = params;
    return <GroupVotingDetailTemplate id={String(id) || ""} />
}
