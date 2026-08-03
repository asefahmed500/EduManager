"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, XIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { notify } from "@/lib/toast";
import {
  addSubjectToClass,
  assignTeacher,
  removeSubjectFromClass,
  unassignTeacher,
} from "@/app/actions/admin";

type Teacher = { id: number; name: string };

type ClassSubjectRow = {
  id: number;
  subjectId: number;
  subjectName: string;
  teachers: { id: number; teacherName: string }[];
};

type Props = {
  classId: number;
  subjects: { id: number; name: string }[];
  teachers: Teacher[];
  rows: ClassSubjectRow[];
};

export function ClassManager({ classId, subjects, teachers, rows }: Props) {
  const router = useRouter();
  const [subjectId, setSubjectId] = React.useState("");
  const [teacherSel, setTeacherSel] = React.useState<Record<number, string>>(
    {},
  );
  const subjectLabels = Object.fromEntries(
    subjects.map((s) => [String(s.id), s.name]),
  );
  const teacherLabels = Object.fromEntries(
    teachers.map((t) => [String(t.id), t.name]),
  );

  async function addSubject() {
    if (!subjectId) {
      notify.error("Select a subject first.");
      return;
    }
    const r = await addSubjectToClass(classId, Number(subjectId));
    if (r?.error) notify.error(r.error);
    else {
      notify.success("Subject mapped.");
      setSubjectId("");
      router.refresh();
    }
  }

  async function addTeacher(csId: number) {
    const tId = teacherSel[csId];
    if (!tId) {
      notify.error("Select a teacher first.");
      return;
    }
    const r = await assignTeacher(Number(tId), csId);
    if (r?.error) notify.error(r.error);
    else {
      notify.success("Teacher assigned.");
      setTeacherSel((s) => ({ ...s, [csId]: "" }));
      router.refresh();
    }
  }

  async function removeMapping(csId: number) {
    const r = await removeSubjectFromClass(csId);
    if (r?.error) notify.error(r.error);
    else {
      notify.success("Removed.");
      router.refresh();
    }
  }

  async function removeTeacher(linkId: number) {
    const r = await unassignTeacher(linkId);
    if (r?.error) notify.error(r.error);
    else router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <span className="mb-1 block text-[0.7rem] uppercase tracking-[0.08em] text-muted-foreground">
            Add subject
          </span>
          <Select value={subjectId} onValueChange={(v) => setSubjectId(v ?? "")}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue>
                {(v) => (v ? subjectLabels[v] ?? v : "Select subject")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-9"
          onClick={addSubject}
        >
          <PlusIcon className="size-4" /> Add
        </Button>
      </div>

      <ul className="flex flex-col gap-3">
        {rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No subjects mapped to this class yet.
          </p>
        ) : null}
        {rows.map((r) => (
          <li key={r.id} className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{r.subjectName}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Remove subject"
                onClick={() => removeMapping(r.id)}
              >
                <XIcon className="size-4" />
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {r.teachers.map((t) => (
                <Badge
                  key={t.id}
                  variant="secondary"
                  className="gap-1 py-1 pl-2"
                >
                  {t.teacherName}
                  <button
                    type="button"
                    aria-label="Unassign teacher"
                    className="ml-0.5"
                    onClick={() => removeTeacher(t.id)}
                  >
                    <XIcon className="size-3" />
                  </button>
                </Badge>
              ))}
              {teachers.length > 0 ? (
                <div className="flex items-center gap-1">
                  <Select
                    value={teacherSel[r.id] ?? ""}
                    onValueChange={(v) =>
                      setTeacherSel((s) => ({ ...s, [r.id]: v ?? "" }))
                    }
                  >
                    <SelectTrigger size="sm" className="h-7 w-44">
                      <SelectValue>
                        {(v) => (v ? teacherLabels[v] ?? v : "Assign teacher")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Assign"
                    onClick={() => addTeacher(r.id)}
                  >
                    <PlusIcon className="size-4" />
                  </Button>
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
