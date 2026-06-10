import { useEffect, useRef, useState } from 'react'
import { EllipsisVertical } from 'lucide-react'
import {
  Box,
  Button,
  Flex,
  Icon,
  IconButton,
  Input,
  Stack,
  Text,
} from '../../../../components/chakra-ui'
import { AlertStatusBadge } from './AlertStatusBadge'
import type { GovernmentAlert } from '../types/alert'
import { formatAlertValue } from '../utils/alertStatus'

type AlertListItemProps = {
  alert: GovernmentAlert
  isMenuOpen: boolean
  onDelete: (alertId: string) => void
  onSetOpenMenuAlertId: (alertId: string | null) => void
  onUpdateThreshold: (alertId: string, thresholdValue: number) => void
}

function isNumericInput(value: string) {
  return value === '' || /^\d*\.?\d*$/.test(value)
}

function getNumericValue(value: string) {
  const parsedValue = Number(value)

  if (value.trim() === '' || Number.isNaN(parsedValue)) {
    return null
  }

  return parsedValue
}

export function AlertListItem({
  alert,
  isMenuOpen,
  onDelete,
  onSetOpenMenuAlertId,
  onUpdateThreshold,
}: AlertListItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedThresholdValue, setEditedThresholdValue] = useState(
    alert.thresholdValue.toString(),
  )
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const numericEditedValue = getNumericValue(editedThresholdValue)
  const hasValidEditedValue = numericEditedValue !== null
  const hasThresholdChanged =
    hasValidEditedValue && numericEditedValue !== alert.thresholdValue
  const isTriggered = alert.status === 'Critical'

  function handleStartEdit() {
    setEditedThresholdValue(alert.thresholdValue.toString())
    setIsEditing(true)
    onSetOpenMenuAlertId(null)
  }

  function handleCancelEdit() {
    setEditedThresholdValue(alert.thresholdValue.toString())
    setIsEditing(false)
  }

  function handleSaveEdit() {
    if (!hasThresholdChanged || numericEditedValue === null) {
      return
    }

    onUpdateThreshold(alert.id, numericEditedValue)
    setIsEditing(false)
  }

  function handleDeleteClick() {
    onSetOpenMenuAlertId(null)
    setIsDeletePopupOpen(true)
  }

  function handleConfirmDelete() {
    onDelete(alert.id)
    setIsDeletePopupOpen(false)
  }

  useEffect(() => {
    if (!isMenuOpen) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        onSetOpenMenuAlertId(null)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [isMenuOpen, onSetOpenMenuAlertId])

  return (
    <>
      <Box
        bg={isTriggered ? 'rgba(254, 226, 226, 0.55)' : 'white'}
        borderColor={isTriggered ? 'red.300' : 'gray.100'}
        borderTopWidth={isTriggered ? '0' : '1px'}
        borderWidth={isTriggered ? '1px' : undefined}
        mx={isTriggered ? '3' : undefined}
        mb={isTriggered ? '3' : undefined}
        px="4"
        py="4"
        transition="background-color 0.16s ease, border-color 0.16s ease"
        _hover={{
          bg: isTriggered ? 'red.50' : 'gray.50',
          borderColor: isTriggered ? 'red.300' : 'gray.200',
        }}
      >
        <Box
          display="grid"
          gap="4"
          gridTemplateColumns={{
            base: '1fr',
            xl: '2fr 1fr 1fr 1fr 48px',
          }}
          alignItems="center"
        >
          <Stack gap="1">
            <Text color="gray.900" fontWeight="700">
              {alert.name}
            </Text>
          </Stack>

          <Box>
            <AlertStatusBadge status={alert.status} />
          </Box>

          <Text color="gray.900" fontWeight="700">
            {formatAlertValue(alert.currentValue, alert.unit)}
          </Text>

          <Box>
            {isEditing ? (
              <Input
                maxW="140px"
                type="text"
                inputMode="decimal"
                value={editedThresholdValue}
                onChange={(event) => {
                  const nextValue = event.target.value

                  if (isNumericInput(nextValue)) {
                    setEditedThresholdValue(nextValue)
                  }
                }}
              />
            ) : (
              <Button
                color="blue.700"
                fontSize="md"
                fontWeight="700"
                h="auto"
                lineHeight="normal"
                minW="auto"
                p="0"
                variant="ghost"
                onClick={handleStartEdit}
                _hover={{
                  bg: 'transparent',
                  color: 'blue.900',
                  textDecoration: 'underline',
                }}
              >
                {formatAlertValue(alert.thresholdValue, alert.unit)}
              </Button>
            )}
          </Box>

          <Box
            ref={menuRef}
            position="relative"
            justifySelf={{ base: 'start', xl: 'end' }}
          >
            <IconButton
              aria-label={`Open actions for ${alert.name}`}
              color="gray.500"
              size="sm"
              variant="ghost"
              onClick={() =>
                onSetOpenMenuAlertId(isMenuOpen ? null : alert.id)
              }
              _hover={{
                bg: 'gray.50',
                color: 'gray.900',
              }}
            >
              <Icon as={EllipsisVertical} />
            </IconButton>

            {isMenuOpen && (
              <Box
                bg="white"
                borderColor="gray.200"
                borderWidth="1px"
                boxShadow="lg"
                minW="140px"
                position="absolute"
                right="0"
                top="36px"
                zIndex="10"
              >
                <Button
                  justifyContent="flex-start"
                  px="4"
                  py="3"
                  size="sm"
                  variant="ghost"
                  w="full"
                  onClick={handleStartEdit}
                >
                  Edit
                </Button>

                <Button
                  color="red.600"
                  justifyContent="flex-start"
                  px="4"
                  py="3"
                  size="sm"
                  variant="ghost"
                  w="full"
                  onClick={handleDeleteClick}
                  _hover={{
                    bg: 'red.50',
                  }}
                >
                  Delete
                </Button>
              </Box>
            )}
          </Box>
        </Box>

        {isEditing && (
          <Flex justify="flex-end" gap="3" mt="4">
            <Button size="sm" variant="outline" onClick={handleCancelEdit}>
              Cancel
            </Button>

            <Button
              bg="blue.900"
              color="white"
              disabled={!hasThresholdChanged}
              size="sm"
              onClick={handleSaveEdit}
              _hover={{
                bg: hasThresholdChanged ? 'blue.800' : 'blue.900',
              }}
            >
              Save
            </Button>
          </Flex>
        )}
      </Box>

      {isDeletePopupOpen && (
        <Flex
          align="center"
          bg="blackAlpha.500"
          inset="0"
          justify="center"
          position="fixed"
          px="4"
          zIndex="1000"
        >
          <Box
            bg="white"
            borderColor="gray.200"
            borderWidth="1px"
            boxShadow="xl"
            maxW="420px"
            p="6"
            w="full"
          >
            <Stack gap="4">
              <Box>
                <Text color="gray.900" fontSize="lg" fontWeight="900">
                  Delete threshold?
                </Text>

                <Text color="gray.600" mt="2">
                  Are you sure you wish to delete {alert.name}?
                </Text>
              </Box>

              <Flex justify="flex-end" gap="3">
                <Button
                  variant="outline"
                  onClick={() => setIsDeletePopupOpen(false)}
                >
                  Cancel
                </Button>

                <Button
                  bg="red.600"
                  color="white"
                  onClick={handleConfirmDelete}
                  _hover={{
                    bg: 'red.700',
                  }}
                >
                  Delete
                </Button>
              </Flex>
            </Stack>
          </Box>
        </Flex>
      )}
    </>
  )
}
