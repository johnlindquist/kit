export interface NotificationAction {
	// Docs: https://electronjs.org/docs/api/structures/notification-action

	/**
	 * The label for the given action.
	 */
	text?: string
	/**
	 * The type of action, can be `button`.
	 */
	type: "button"
}

export interface NotificationConstructorOptions {
	/**
	 * A title for the notification, which will be displayed at the top of the
	 * notification window when it is shown.
	 */
	title?: string
	/**
	 * A subtitle for the notification, which will be displayed below the title.
	 *
	 * @platform darwin
	 */
	subtitle?: string
	/**
	 * The body text of the notification, which will be displayed below the title or
	 * subtitle.
	 */
	body?: string
	/**
	 * Whether or not to suppress the OS notification noise when showing the
	 * notification.
	 */
	silent?: boolean
	/**
	 * An icon to use in the notification.
	 */
	icon?: string
	/**
	 * Whether or not to add an inline reply option to the notification.
	 *
	 * @platform darwin
	 */
	hasReply?: boolean
	/**
	 * The timeout duration of the notification. Can be 'default' or 'never'.
	 *
	 * @platform linux,win32
	 */
	timeoutType?: "default" | "never"
	/**
	 * The placeholder to write in the inline reply input field.
	 *
	 * @platform darwin
	 */
	replyPlaceholder?: string
	/**
	 * The name of the sound file to play when the notification is shown.
	 *
	 * @platform darwin
	 */
	sound?: string
	/**
	 * The urgency level of the notification. Can be 'normal', 'critical', or 'low'.
	 *
	 * @platform linux
	 */
	urgency?: "normal" | "critical" | "low"
	/**
	 * Actions to add to the notification. Please read the available actions and
	 * limitations in the `NotificationAction` documentation.
	 *
	 * @platform darwin
	 */
	actions?: NotificationAction[]
	/**
	 * A custom title for the close button of an alert. An empty string will cause the
	 * default localized text to be used.
	 *
	 * @platform darwin
	 */
	closeButtonText?: string
	/**
	 * A custom description of the Notification on Windows superseding all properties
	 * above. Provides full customization of design and behavior of the notification.
	 *
	 * @platform win32
	 */
	toastXml?: string
}
