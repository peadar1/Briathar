CREATE TABLE "quiz_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"user_id" text,
	"preset_id" text,
	"mode" jsonb NOT NULL,
	"config" jsonb NOT NULL,
	"strict_fadas" boolean NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"correct" integer DEFAULT 0 NOT NULL,
	"attempted" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"lemma" text NOT NULL,
	"tense" text NOT NULL,
	"form" text NOT NULL,
	"persons" jsonb NOT NULL,
	"answered_at" timestamp with time zone,
	"responses" jsonb,
	"results" jsonb
);
--> statement-breakpoint
ALTER TABLE "session_questions" ADD CONSTRAINT "session_questions_session_id_quiz_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."quiz_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "session_questions_session_position" ON "session_questions" USING btree ("session_id","position");