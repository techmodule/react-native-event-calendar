// @flow
import {Image, Text, TouchableOpacity, View, VirtualizedList} from 'react-native';
import _ from 'lodash';
import moment from 'moment';
import React from 'react';
import styleConstructor from './style';

import DayView from './DayView';

export default class EventCalendar extends React.Component {
    constructor(props) {
        super(props);
        const start = props.start ? props.start : 0;
        const end = props.end ? props.end : 24;
        this.theme = props.theme;
        this.styles = styleConstructor(props.styles, (end - start) * 100);
        const sizeTopEvents = props.sizeTopEvents ? props.sizeTopEvents : 2;
        const heightTopEvents = props.heightTopEvents ? props.heightTopEvents : 26;
        this.state = {
            date: moment(this.props.initDate),
            index: this.props.size,
            showMoreTopEvents: false,
            heightTopEvents,
            sizeTopEvents,

        };
    }

    componentDidMount() {
        if (this.props.onRef) {
            this.props.onRef(this);
        }
    }

    componentWillUnmount() {
        if (this.props.onRef) {
            this.props.onRef(undefined);
        }
    }

    static defaultProps = {
        size: 30,
        initDate: new Date(),
        formatHeader: 'DD MMMM YYYY',
    };

    _getItemLayout(data, index) {
        const {width} = this.props;
        return {length: width, offset: width * index, index};
    }

    _onEventTapped(event) {
        this.props.eventTapped(event);
    }

    _getItem(events, index) {
        const date = moment(this.props.initDate).add(
            index - this.props.size,
            'days'
        );
        if (this.props.isShowTopEvent) {
            let zeroOfDay = moment(date).startOf('day');
            let startOfDay = moment(date).startOf('day');
            if (this.props.start) {
                startOfDay = moment(startOfDay).add(this.props.start, 'hours');
            }
            let endOfDay = moment(date).endOf('day');
            if (this.props.end) {
                endOfDay = moment(startOfDay).add(this.props.end, 'hours');
            }
            //Alert.alert("endOfDay", moment(endOfDay).format("YYYY-MM-DD hh:mm:ss"));
            const inDayEvents = _.filter(events, event => {
                const eventStartTime = moment(event.start);
                const eventEndTime = moment(event.end);
                return (
                    eventStartTime >= startOfDay &&
                    eventEndTime <= endOfDay
                );
            });
            let allDayEvents = [];
            for (const event of events) {
                const eventStartTime = moment(event.start);
                const eventEndTime = moment(event.end);
                if (eventStartTime < startOfDay && eventEndTime > startOfDay) {
                    allDayEvents.push(event);
                }
                if (eventStartTime > zeroOfDay && eventStartTime < endOfDay && eventEndTime > endOfDay) {
                    allDayEvents.push(event);
                }
            }
            return [inDayEvents, allDayEvents];
        } else {
            let inDayEvents = _.filter(events, event => {
                const eventStartTime = moment(event.start);
                return (
                    eventStartTime >= date.clone().startOf('day') &&
                    eventStartTime <= date.clone().endOf('day')
                );
            });
            return [inDayEvents, []];
        }

    }

    _renderAllDayEvents(fullDayEvents) {
        const styles = this.styles;
        let allTopEvents = fullDayEvents;
        if (!this.state.showMoreTopEvents) {
            allTopEvents = allTopEvents.slice(0, this.props.sizeTopEvents);
        }
        let eventsView = allTopEvents.map((event, i) => {
            let style = {
                width: this.props.width - 10,
            };
            if (fullDayEvents.length > this.props.sizeTopEvents) {
                style = {
                    width: this.props.width - 50,
                };
            }
            const eventColor = {
                backgroundColor: event.color,
            };

            return (
                <TouchableOpacity
                    activeOpacity={0.5}
                    onPress={() =>
                        this._onEventTapped(event)
                    }
                    key={i} style={[styles.allDayEvent, style, event.color && eventColor]}
                >
                    {this.props.renderAllDayEvent ? (
                        this.props.renderAllDayEvent(event)
                    ) : (
                        <View>
                            <Text numberOfLines={1} style={styles.eventTitle}>
                                {event.title}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            );
        });
        const showMoreIcon = this.props.showMoreIcon ? (
            this.props.showMoreIcon
        ) : (
            <Image source={require('./showmore.png')} style={styles.arrow}/>
        );
        const showLessIcon = this.props.showLessIcon ? (
            this.props.showLessIcon
        ) : (
            <Image source={require('./showless.png')} style={styles.arrow}/>
        );

        return (
            <View>
                {fullDayEvents.length > this.props.sizeTopEvents ? (
                    <View style={{
                        alignContent: "center",
                        alignItems: "center",
                        flexDirection: "row",
                    }}>
                        <View>
                            {eventsView}
                        </View>
                        {this.state.showMoreTopEvents ? (
                            <TouchableOpacity
                                style={styles.arrowButton}
                                onPress={() => this.setState({showMoreTopEvents: false})}
                            >
                                {showLessIcon}
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={styles.arrowButton}
                                onPress={() => this.setState({showMoreTopEvents: true})}
                            >
                                {showMoreIcon}
                            </TouchableOpacity>
                        )}

                    </View>
                ) : (<View style={{
                    alignContent: "center",
                    alignItems: "center",
                }}>{eventsView}</View>)}
            </View>
        );
    }

    _renderItem({index, item}) {
        const {
            width,
            format24h,
            initDate,
            scrollToFirst = true,
            start = 0,
            end = 24,
            formatHeader,
            upperCaseHeader = false,
        } = this.props;
        let allDayEvents = item[1];
        let topHeight = this.state.heightTopEvents * this.props.sizeTopEvents + 10;
        let fullTopHeight = this.state.heightTopEvents * allDayEvents.length + 10;
        if (this.props.sizeTopEvents > allDayEvents.length) {
            topHeight = this.state.heightTopEvents * allDayEvents.length + 10;
        }
        const date = moment(initDate).add(index - this.props.size, 'days');
        const leftIcon = this.props.headerIconLeft ? (
            this.props.headerIconLeft
        ) : (
            <Image source={require('./back.png')} style={this.styles.arrow}/>
        );
        const rightIcon = this.props.headerIconRight ? (
            this.props.headerIconRight
        ) : (
            <Image source={require('./forward.png')} style={this.styles.arrow}/>
        );

        let headerText = upperCaseHeader
            ? date.format(formatHeader || 'DD MMMM YYYY').toUpperCase()
            : date.format(formatHeader || 'DD MMMM YYYY');

        return (
            <View style={[this.styles.container, {width}]}>
                <View style={this.styles.header}>
                    <TouchableOpacity
                        style={this.styles.arrowButton}
                        onPress={this._previous}
                    >
                        {leftIcon}
                    </TouchableOpacity>
                    <View style={this.styles.headerTextContainer}>
                        <Text style={this.styles.headerText}>{headerText}</Text>
                    </View>
                    <TouchableOpacity
                        style={this.styles.arrowButton}
                        onPress={this._next}
                    >
                        {rightIcon}
                    </TouchableOpacity>
                </View>
                {item[1].length > 0 &&
                <View style={{
                    height: this.state.showMoreTopEvents ? fullTopHeight : topHeight,
                    //height:300,
                    marginTop: 2,
                }}>
                    {this._renderAllDayEvents(item[1])}
                </View>}
                <DayView
                    date={date}
                    index={index}
                    format24h={format24h}
                    isLoading={this.props.isLoading}
                    formatHeader={this.props.formatHeader}
                    headerStyle={this.props.headerStyle}
                    renderEvent={this.props.renderEvent}
                    eventTapped={this.props.eventTapped}
                    allDayEvents={item[1]}
                    events={item[0]}
                    width={width}
                    styles={this.styles}
                    scrollToFirst={scrollToFirst}
                    start={start}
                    end={end}
                />

            </View>
        );
    }

    _goToPage(index) {
        if (index <= 0 || index >= this.props.size * 2) {
            return;
        }
        const date = moment(this.props.initDate).add(
            index - this.props.size,
            'days'
        );
        this.refs.calendar.scrollToIndex({index, animated: false});
        this.setState({index, date});
    }

    _goToDate(date) {
        const earliestDate = moment(this.props.initDate).subtract(
            this.props.size,
            'days'
        );
        const index = moment(date).diff(earliestDate, 'days');
        this._goToPage(index);
    }

    _previous = () => {
        this._goToPage(this.state.index - 1);
        if (this.props.dateChanged) {
            this.props.dateChanged(
                moment(this.props.initDate)
                    .add(this.state.index - 1 - this.props.size, 'days')
                    .format('YYYY-MM-DD')
            );
        }
    };

    _next = () => {
        this._goToPage(this.state.index + 1);
        if (this.props.dateChanged) {
            this.props.dateChanged(
                moment(this.props.initDate)
                    .add(this.state.index + 1 - this.props.size, 'days')
                    .format('YYYY-MM-DD')
            );
        }
    };

    render() {
        const {
            width,
            virtualizedListProps,
            events,
            initDate,
            theme,
        } = this.props;
        return (
            <View style={[this.styles.container, {width}]}>
                <VirtualizedList
                    ref="calendar"
                    windowSize={2}
                    initialNumToRender={2}
                    initialScrollIndex={this.props.size}
                    data={events}
                    getItemCount={() => this.props.size * 2}
                    getItem={this._getItem.bind(this)}
                    keyExtractor={(item, index) => index.toString()}
                    getItemLayout={this._getItemLayout.bind(this)}
                    horizontal
                    pagingEnabled
                    renderItem={this._renderItem.bind(this)}
                    style={{width: width}}
                    onMomentumScrollEnd={event => {
                        const index = parseInt(event.nativeEvent.contentOffset.x / width);
                        const date = moment(this.props.initDate).add(
                            index - this.props.size,
                            'days'
                        );
                        if (this.props.dateChanged) {
                            this.props.dateChanged(date.format('YYYY-MM-DD'));
                        }
                        this.setState({index, date});
                    }}
                    {...virtualizedListProps}
                />
                {this.props.renderBottomMenu && <View style={{
                    bottom: this.props.bottomMenuBottom ? this.props.bottomMenuBottom : 120,
                    height: this.props.bottomMenuHeight ? this.props.bottomMenuHeight : 200,
                    width: this.props.width,
                    backgroundColor: "transparent",
                    alignContent: "center",
                    alignItems: "center",
                    padding: 10,
                }}>{this.props.renderBottomMenu}</View>}
            </View>
        );
    }
}
