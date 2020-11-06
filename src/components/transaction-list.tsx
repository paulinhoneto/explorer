import { Box, BoxProps, Flex, FlexProps, Grid, Stack, transition } from '@stacks/ui';
import { Caption, Text } from '@components/typography';
import {
  MempoolTransaction,
  MempoolTransactionListResponse,
  Transaction,
  TransactionResults,
} from '@blockstack/stacks-blockchain-api-types';
import NextLink from 'next/link';
import React from 'react';
import { Tag } from '@components/tags';
import { TransactionType } from '@models/transaction.interface';
import { TxItem } from '@components/transaction-item';
import { TxLink } from '@components/links';
import { border } from '@common/utils';
import { color } from '@components/color-modes';

import { Section } from '@components/section';

const Item: React.FC<
  { tx: MempoolTransaction | Transaction; isLast?: boolean; principal?: string } & BoxProps
> = React.memo(({ tx, isLast, principal, ...rest }) => {
  return (
    <Box
      borderLeft="3px solid"
      borderLeftColor={color('bg')}
      borderBottom={isLast ? 'unset' : '1px solid'}
      borderBottomColor="var(--colors-border)"
      transition={transition}
      bg={color('bg')}
      _hover={{
        bg: color('bg-alt'),
        borderLeftColor: color('accent'),
      }}
      position="relative"
    >
      <TxLink txid={tx.tx_id} {...rest}>
        <Box as="a" position="absolute" size="100%" />
      </TxLink>
      <TxItem as="span" tx={tx} principal={principal} key={tx.tx_id} />
    </Box>
  );
});

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const VirtualList: React.FC<{
  items: (MempoolTransaction | Transaction)[];
  principal?: string;
}> = React.memo(({ items, principal }) => {
  return items.length ? (
    <Flex flexDirection="column">
      {items.map((tx: MempoolTransaction | Transaction, index: number) => (
        <Item principal={principal} key={index} tx={tx} isLast={index === items.length - 1} />
      ))}
    </Flex>
  ) : (
    <></>
  );
});

const EmptyMessage: React.FC = props => (
  <Grid px="base" py="64px" placeItems="center">
    <Caption>There are no transactions yet.'</Caption>
  </Grid>
);

const ViewAllButton: React.FC = React.memo(props => (
  <NextLink href="/transactions" passHref>
    <Grid
      as="a"
      borderTop={border()}
      px="base"
      py="base"
      placeItems="center"
      bg={color('bg')}
      _hover={{ bg: color('bg-alt') }}
    >
      <Caption>View all transactions</Caption>
    </Grid>
  </NextLink>
));

const LoadMoreButton: React.FC<any> = React.memo(({ loadMore }) => (
  <Grid
    as="a"
    borderTop={border()}
    px="base"
    py="base"
    placeItems="center"
    bg={color('bg')}
    _hover={{ bg: color('bg-alt') }}
    onClick={loadMore}
  >
    <Caption>Load more</Caption>
  </Grid>
));

const Filter = () => {
  const types = [
    TransactionType.CONTRACT_CALL,
    TransactionType.SMART_CONTRACT,
    TransactionType.TOKEN_TRANSFER,
  ];
  const [selectedTypes, setSelectedTypes] = React.useState<TransactionType[]>(types);
  return (
    <Box>
      <Caption mb="tight">Filter by type</Caption>
      <Stack flexWrap="wrap" isInline>
        {types.map(type => {
          const isSelected = selectedTypes?.length
            ? selectedTypes.find(selected => selected === type)
            : true;

          return (
            <Tag
              mb="tight"
              _hover={{ cursor: 'pointer', opacity: isSelected ? 1 : 0.75 }}
              opacity={isSelected ? 1 : 0.5}
              // onClick={() => handleClick(type)}
              type={type}
            />
          );
        })}
      </Stack>
    </Box>
  );
};

const PendingList: React.FC<any> = React.memo(
  ({ pending, handleTogglePendingVisibility, pendingVisible }) =>
    pendingVisible ? (
      <Box borderBottom={border()} flexGrow={1}>
        <Flex
          justifyContent="space-between"
          bg={color('bg')}
          py="tight"
          px="base"
          borderBottom={border()}
        >
          <Caption>Pending ({pending.length})</Caption>
          <Caption
            onClick={handleTogglePendingVisibility}
            _hover={{
              color: pendingVisible ? color('accent') : undefined,
              cursor: 'pointer',
            }}
          >
            {pendingVisible ? 'Hide' : 'Show'} pending transactions
          </Caption>
        </Flex>

        <VirtualList items={pending} />
      </Box>
    ) : null
);

export const TransactionList: React.FC<
  {
    mempool?: MempoolTransactionListResponse['results'];
    transactions: TransactionResults['results'];
    // Boolean for homepage view
    recent?: boolean;
    isReachingEnd?: boolean;
    isLoadingMore?: boolean;
    principal?: string;
    loadMore?: () => void;
  } & FlexProps
> = React.memo(
  ({
    mempool = [],
    transactions,
    recent,
    loadMore,
    isReachingEnd,
    principal,
    isLoadingMore,
    ...rest
  }) => {
    const [pendingVisibility, setPendingVisibility] = React.useState<'visible' | 'hidden'>(
      'visible'
    );

    const handleTogglePendingVisibility = React.useCallback(() => {
      setPendingVisibility(s => (s === 'visible' ? 'hidden' : 'visible'));
    }, [setPendingVisibility]);

    const pending: MempoolTransactionListResponse['results'] = React.useMemo(
      () =>
        mempool.filter(tx => {
          const now = new Date().getTime();
          const pendingTime = tx.receipt_time * 1000;
          if (now - pendingTime <= 1000 * 60 * 60) {
            return true;
          }
          return false;
        }),
      [mempool]
    );

    const pendingVisible = pending?.length > 0 && pendingVisibility === 'visible';

    const hasTransactions = !!transactions?.length;

    return (
      <Section title="Transactions" {...rest}>
        <>
          <PendingList
            principal={principal}
            pending={pending}
            handleTogglePendingVisibility={handleTogglePendingVisibility}
            pendingVisible={pendingVisible}
          />
          {hasTransactions ? (
            <Box flexGrow={1}>
              <Flex
                bg={color('bg')}
                justifyContent="space-between"
                py="tight"
                px="base"
                borderBottom={border()}
              >
                <Caption>Confirmed</Caption>
                <Flex alignItems="center">
                  {!recent && <Caption>Filter</Caption>}
                  {!pendingVisible && pending.length > 0 && (
                    <Caption
                      ml="base"
                      onClick={handleTogglePendingVisibility}
                      _hover={{
                        color: pendingVisible ? color('accent') : undefined,
                        cursor: 'pointer',
                      }}
                    >
                      {pendingVisible ? 'Hide' : 'Show'} pending transactions ({pending.length})
                    </Caption>
                  )}
                </Flex>
              </Flex>
              <VirtualList principal={principal} items={transactions} />
            </Box>
          ) : (
            <Grid placeItems="center" px="base" py="extra-loose">
              <Caption>No transactions yet</Caption>
            </Grid>
          )}
          {hasTransactions && recent ? <ViewAllButton /> : null}
          {!isReachingEnd && loadMore ? (
            <LoadMoreButton isLoadingMore={isLoadingMore} loadMore={loadMore} />
          ) : null}{' '}
        </>
      </Section>
    );
  }
);