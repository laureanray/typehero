'use server';
import { getServerAuthSession } from '@repo/auth/server';
import { prisma } from '@repo/db';
import type { CommentRoot } from '@repo/db/types';

const PAGESIZE = 10;

const sortKeys = ['createdAt', 'vote', 'replies'] as const;
const sortOrders = ['asc', 'desc'] as const;

export type SortKey = (typeof sortKeys)[number];
export type SortOrder = (typeof sortOrders)[number];

function orderBy(sortKey: SortKey, sortOrder: SortOrder) {
  switch (sortKey) {
    case 'vote':
      return {
        vote: {
          _count: sortOrder,
        },
      };
    case 'replies':
      return {
        replies: {
          _count: sortOrder,
        },
      };
    case 'createdAt':
      return {
        [sortKey]: sortOrder,
      };
  }
}

export type PaginatedComments = NonNullable<Awaited<ReturnType<typeof getPaginatedComments>>>;

export async function getPaginatedComments({
  page,
  rootId,
  rootType,
  parentId = null,
  sortKey = 'createdAt',
  sortOrder = 'desc',
}: {
  page: number;
  rootId: number;
  rootType: CommentRoot;
  parentId?: number | null;
  sortKey?: SortKey;
  sortOrder?: SortOrder;
}) {
  const session = await getServerAuthSession();

  const totalComments = await prisma.comment.count({
    where: {
      rootType,
      parentId,
      visible: true,
      ...(rootType === 'CHALLENGE' ? { rootChallengeId: rootId } : { rootSolutionId: rootId }),
    },
  });

  const totalReplies = await prisma.comment.count({
    where: {
      rootType,
      parentId: {
        not: null,
      },
      visible: true,
      ...(rootType === 'CHALLENGE' ? { rootChallengeId: rootId } : { rootSolutionId: rootId }),
    },
  });

  const comments = await prisma.comment.findMany({
    skip: (page - 1) * PAGESIZE,
    take: PAGESIZE,
    where: {
      rootType,
      parentId,
      ...(rootType === 'CHALLENGE' ? { rootChallengeId: rootId } : { rootSolutionId: rootId }),
      visible: true,
    },
    orderBy: orderBy(sortKey, sortOrder),
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          replies: true,
          vote: true,
        },
      },
      vote: {
        select: {
          userId: true,
        },
        where: {
          userId: session?.user.id || '',
        },
      },
      rootChallenge: {
        select: {
          name: true,
        },
      },
      rootSolution: {
        select: {
          title: true,
        },
      },
    },
  });

  const totalPages = Math.ceil(totalComments / PAGESIZE);

  return {
    totalComments: totalReplies + totalComments,
    totalPages,
    hasMore: page < totalPages,
    comments,
  };
}
