import Link from 'next/link';
import type { ReportWithInfo } from '../../report.action';

export function CommentReport({ report }: { report: NonNullable<ReportWithInfo> }) {
  if (report.type !== 'COMMENT' || report.commentId === null || !report.comment) return null;
  const rootId = report.comment.rootChallengeId ?? report.comment.rootSolutionId ?? -1;

  return (
    <div>
      <header>
        Commented on{' '}
        <Link
          className="rounded-full bg-zinc-800 px-2 py-1 text-blue-600 dark:text-blue-400"
          href={`/${report.comment.rootType.toLowerCase()}/${
            report.comment.rootChallengeId || report.comment.rootSolutionId
          }`}
        >
          <div className="bg-primary-foreground mr-2 inline-block rounded-full px-2 text-white">
            {report.comment.rootType}
          </div>
          {report.comment.rootType === 'CHALLENGE'
            ? report.comment.rootChallenge?.name
            : report.comment.rootSolution?.title}
        </Link>
      </header>
      <section className="mt-4 rounded-lg bg-zinc-800">
        <pre>{JSON.stringify(report.comment, null, 2)}</pre>
        {/* <Comment comment={report.comment} readonly rootId={rootId} type={report.comment.rootType} />   */}
      </section>
    </div>
  );
}
