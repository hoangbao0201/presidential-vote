import SetCandidate from "@/components/modules/SetCandidate";

export default function SetCandidatePage({ params }: SearchParamProps) {
    const { id } = params;
    return <SetCandidate id={String(id) || ""} />
}