import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Icon,
  Spinner,
  Text,
} from '@chakra-ui/react'
import axios from 'axios'
import { useState, useEffect } from 'react'
import { BsArrowDownCircleFill, BsArrowUpCircleFill } from 'react-icons/bs'
import CardBase from '../../components/Card/CardBase'
import FeedbackItem from '../../components/FeebackCards/FeedbackItem'
import Layout from '../../components/Layout'
import TradeTable from '../../components/Trades/TradeTable'
import { Feedback, TradeData } from '../../types'
import { useAuth } from '../../utils/auth'
import { TradeGuidelines } from './trades'

const FeedbackVotingPage = () => {
  const { user, authLoading, getIdToken } = useAuth()
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [currentFeedback, setCurrentFeedback] = useState<Feedback>()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')

  const isAdmin = user?.role === 'ADMIN'

  useEffect(() => {
    if (!authLoading && user) init()
  }, [authLoading, user])

  const init = async () => {
    setError('')
    setIsLoading(true)
    try {
      const token = await getIdToken()
      if (!token) throw new Error('No token')

      const res = await axios.get('/api/feedback/getLatest', {
        headers: {
          authorization: `Bearer ${token}`,
        },
      })

      const data: Feedback[] = res.data.map((d: Feedback) => {
        const parsed = JSON.parse(d.json)
        return {
          ...d,
          parsed: parsed,
        }
      })

      setFeedbacks(data)
      setCurrentFeedback(data[0])
    } catch (e: any) {
      console.error(e)
      setError(e.message)
    }
    setIsLoading(false)
  }

  const handleVote = async (action: 'upvote' | 'downvote') => {
    setIsLoading(true)

    try {
      if (!currentFeedback) throw new Error('No feedback selected')
      const token = await getIdToken()
      if (!token) throw new Error('No token')

      const res = await axios.post(
        '/api/feedback/vote',
        {
          action,
          feedback_id: currentFeedback?.feedback_id,
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      )

      if (res.data.success) {
        const newFeedbacks = feedbacks.filter(
          (f) => f.feedback_id !== currentFeedback?.feedback_id
        )
        setFeedbacks(newFeedbacks)
        setCurrentFeedback(newFeedbacks[0])
      } else throw new Error(res.data.message)
    } catch (e: any) {
      console.error(e)
      setError(e.message)
    }

    setIsLoading(false)
  }

  return (
    <Layout>
      <Heading>The Feedback System</Heading>
      <Text>
        Most of our content is collected and categorized automatically but there
        are some things our machines can&apos;t do. And you can help it!
      </Text>
      <Flex mt={12} gap={12} alignItems="flex-start">
        <CardBase
          chakraWrapper={{ flex: 2 }}
          title="Voting"
          chakra={{ bg: 'gray.700' }}
        >
          <Text>
            Either way, the more you contribute correctly the more our systems
            will trust your information - meaning your suggestions will be live
            faster.
          </Text>
          <Accordion allowMultiple mt={4}>
            <AccordionItem>
              <AccordionButton>
                <Box as="span" flex="1" textAlign="left">
                  <Text fontWeight={'bold'}>Trade Pricing</Text>
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel pb={4}>
                <TradeGuidelines />
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
          <Center mt={4} fontStyle="italic" fontSize="sm">
            I love democracy - Sheev
          </Center>
        </CardBase>
        <Flex
          flex="1"
          flexFlow="column"
          alignItems="center"
          justifyContent="flex-start"
        >
          {isLoading && (
            <Center>
              <Spinner size="lg" />
            </Center>
          )}

          {!isLoading && !currentFeedback && !error && (
            <Center flexFlow="column" gap={4}>
              <Text>Thanks for helping out! Want more?</Text>
              <Button onClick={init}>YES I NEED IT!!!!!</Button>
              <Text fontSize="xs" color="gray.400" textAlign="center">
                If you click the button and nothing happens you really vote for
                everything... impressive.
              </Text>
            </Center>
          )}

          {!isLoading && currentFeedback && !error && (
            <>
              <CardBase
                chakraWrapper={{ flex: 1, width: '100%' }}
                title="Trade Pricing"
                chakra={{ bg: 'gray.700' }}
              >
                {currentFeedback.type === 'tradePrice' && (
                  <TradeTable
                    data={currentFeedback.parsed?.content.trade as TradeData}
                  />
                )}
                {currentFeedback.type === 'itemChange' && (
                  <FeedbackItem
                    itemTags={
                      currentFeedback.parsed?.content.itemTags as string[]
                    }
                    item_iid={currentFeedback.subject_id as number}
                  />
                )}
              </CardBase>
              <Flex justifyContent="center" mt={4} gap={4}>
                <Button
                  leftIcon={<Icon as={BsArrowDownCircleFill} />}
                  colorScheme="red"
                  onClick={() => handleVote('downvote')}
                  variant="solid"
                >
                  {isAdmin ? 'Reprove' : 'Downvote'}
                </Button>
                <Button
                  leftIcon={<Icon as={BsArrowUpCircleFill} />}
                  colorScheme="green"
                  variant="solid"
                  onClick={() => handleVote('upvote')}
                  mr={2}
                >
                  {isAdmin ? 'Approve' : 'Upvote'}
                </Button>
              </Flex>
            </>
          )}

          {!isLoading && error && (
            <Center flexFlow="column" gap={4}>
              <Text>Something went wrong :(</Text>
              <Button onClick={init}>Try again</Button>
            </Center>
          )}
        </Flex>
      </Flex>
    </Layout>
  )
}

export default FeedbackVotingPage
