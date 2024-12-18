import SetAllowedVoters from "@/components/modules/SetAllowedVoters";

export default function SetCandidatePage({ params }: SearchParamProps) {
    const { id } = params;
    return <SetAllowedVoters id={String(id) || ""} />
}