import React from 'react';
import {Alert, Dimensions, Image, Text, TouchableOpacity, View, VirtualizedList} from 'react-native';

import styleConstructor from './style';
import _ from 'lodash';
import {useIsFocused} from "@react-navigation/native";
import moment from "moment";
import DayView,{NewDayView} from "./DayView";

const DEVICE_WIDTH = Math.round(Dimensions.get('window').width);
const EventCalendarSingle = (props) => {
    const isFocused = useIsFocused();
    const calendarRef = React.useRef(null);
    const start = props.start ? props.start : 0;
    const end = props.end ? props.end : 24;
    const size = props.size ? props.size : 30;
    const initDate = props.initDate ? props.initDate : moment().format("YYYY-MM-DD");


    const upperCaseHeader = props.upperCaseHeader ? props.upperCaseHeader : false;
    const formatHeader = props.formatHeader ? props.formatHeader : "DD MMMM YYYY";
    const format24h = props.format24h ? props.format24h : true;
    const scrollToFirst = props.scrollToFirst ? props.scrollToFirst : true;
    const width = props.width ? props.width : DEVICE_WIDTH;
    const events = props.events ? props.events : [];
    const virtualizedListProps = props.virtualizedListProps ? props.virtualizedListProps : undefined;
    const styles = styleConstructor(props.styles, (end - start) * 100);
    const [date, setDate] = React.useState(props.date ? props.date : moment().format("YYYY-MM-DD"));
    const [currentIndex, setCurrentIndex] = React.useState(size*2);
    const [isLoading, setIsLoading] = React.useState(props.isLoading ? props.isLoading : false);
    const [showMoreTopEvents, setShowMoreTopEvents] = React.useState(false);
    const [isShowHeader, setShowHeader] = React.useState(props.isShowHeader ? props.isShowHeader : true);
    const [heightTopEvents, setHeightTopEvents] = React.useState(props.heightTopEvents ? props.heightTopEvents : 26);
    const [sizeTopEvents, setSizeTopEvents] = React.useState(sizeTopEvents ? sizeTopEvents : 2);

    const rightIcon = props.headerIconRight ? (
        props.headerIconRight
    ) : (
        <Image source={require('./forward.png')} style={styles.arrow}/>
    );

    const leftIcon = props.headerIconLeft ? (
        props.headerIconLeft
    ) : (
        <Image source={require('./back.png')} style={styles.arrow}/>
    );
    const _GetEventsByTypeLayout = (data, index) => {
        const {width} = props;
        return {length: width, offset: width * index, index};
    };
    const _onEventTapped = (event) => {
        props.eventTapped(event)
    };
    const showMoreIcon = props.showMoreIcon ? (
        props.showMoreIcon
    ) : (
        <Image source={require('./showmore.png')} style={styles.arrow}/>
    );
    const showLessIcon = props.showLessIcon ? (
        props.showLessIcon
    ) : (
        <Image source={require('./showless.png')} style={styles.arrow}/>
    );
    const _GetEventsByType = (events, date) => {
        if (props.isShowTopEvent) {
            let zeroOfDay = moment(date).startOf('day');
            let startOfDay = moment(date).startOf('day');
            if (props.start) {
                startOfDay = moment(startOfDay).add(props.start, 'hours');
            }
            let endOfDay = moment(date).endOf('day');
            if (props.end) {
                endOfDay = moment(startOfDay).add(props.end, 'hours');
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

    const _renderAllDayEvents = (fullDayEvents) => {
        let allTopEvents = fullDayEvents;
        if (!showMoreTopEvents) {
            allTopEvents = allTopEvents.slice(0, sizeTopEvents);
        }
        let eventsView = allTopEvents.map((event, i) => {
            let style = {
                width: props.width - 10,
            };
            if (fullDayEvents.length > sizeTopEvents) {
                style = {
                    width: props.width - 50,
                };
            }
            const eventColor = {
                backgroundColor: event.color,
            };

            return (
                <TouchableOpacity
                    activeOpacity={0.5}
                    onPress={() =>
                        _onEventTapped(event)
                    }
                    key={i} style={[styles.allDayEvent, style, event.color && eventColor]}
                >
                    {props.renderAllDayEvent ? (
                        props.renderAllDayEvent(event)
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
        return (
            <View>
                {fullDayEvents.length > sizeTopEvents ? (
                    <View style={{
                        alignContent: "center",
                        alignItems: "center",
                        flexDirection: "row",
                    }}>
                        <View>
                            {eventsView}
                        </View>
                        {showMoreTopEvents ? (
                            <TouchableOpacity
                                style={styles.arrowButton}
                                onPress={() => setShowMoreTopEvents(false)}
                            >
                                {showLessIcon}
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={styles.arrowButton}
                                onPress={() => setShowMoreTopEvents(true)}
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
    const _renderEventByDate = (eventListByDate, date) => {
        let item = eventListByDate;
        let allDayEvents = item[1];
        let topHeight = heightTopEvents * sizeTopEvents + 10;
        let fullTopHeight = heightTopEvents * allDayEvents.length + 10;
        if (sizeTopEvents > allDayEvents.length) {
            topHeight = heightTopEvents * allDayEvents.length + 10;
        }
        let headerText = upperCaseHeader
            ? moment(date).format(formatHeader || 'DD MMMM YYYY').toUpperCase()
            : moment(date).format(formatHeader || 'DD MMMM YYYY');

        return (
            <View style={[styles.container, {width}]}>
                {isShowHeader ? (<View style={styles.header}>
                    <TouchableOpacity
                        style={styles.arrowButton}
                        onPress={()=>_previous()}
                    >
                        {leftIcon}
                    </TouchableOpacity>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.headerText}>{headerText}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.arrowButton}
                        onPress={()=>_next()}
                    >
                        {rightIcon}
                    </TouchableOpacity>
                </View>) : (<View></View>)}
                {item[1].length > 0 &&
                <View style={{
                    height: showMoreTopEvents ? fullTopHeight : topHeight,
                    //height:300,
                    marginTop: 2,
                }}>
                    {_renderAllDayEvents(item[1])}
                </View>}

                <NewDayView
                    date={date}
                    //index={index}
                    format24h={format24h}
                    isLoading={isLoading}
                    formatHeader={props.formatHeader}
                    headerStyle={props.headerStyle}
                    renderEvent={props.renderEvent}
                    eventTapped={props.eventTapped}
                    allDayEvents={item[1]}
                    events={item[0]}
                    width={width}
                    styles={styles}
                    scrollToFirst={scrollToFirst}
                    start={start}
                    end={end}
                />
            </View>
        );
    };
    const _goToPage = (index) => {
        //Alert.alert("index", index.toString());
        if (index <= 0 || index >= size * 2) {
            return;
        }
        setCurrentIndex(index);
        const date = moment(initDate).add(
            index - size,
            'days'
        );
        setSelectedDate(date);
        //calendar.scrollToIndex({index, animated: false});
        calendarRef.current.scrollToIndex({index, animated: false});

    };
  

    const _previous = () => {
        setDate(moment(date)
                    .add(-1 , 'days')
                    .format('YYYY-MM-DD'));
        if (props.dateChanged) {
            props.dateChanged(
                moment(date)
                    .add(- 1, 'days')
                    .format('YYYY-MM-DD')
            );
        }
    };

    const _next = () => {
        setDate(moment(date)
                    .add(1 , 'days')
                    .format('YYYY-MM-DD'));
        if (props.dateChanged) {
            props.dateChanged(
                moment(date)
                    .add(1 , 'days')
                    .format('YYYY-MM-DD')
            );

        }

    };
    const list_events_by_date = _GetEventsByType(events, date);
    return (
        <View style={[styles.container, {width}]}>
            {_renderEventByDate(list_events_by_date, date)}
            {props.renderBottomMenu && <View style={{
                bottom: props.bottomMenuBottom ? props.bottomMenuBottom : 120,
                height: props.bottomMenuHeight ? props.bottomMenuHeight : 200,
                width: props.width,
                backgroundColor: "transparent",
                alignContent: "center",
                alignItems: "center",
                padding: 10,
            }}>{props.renderBottomMenu}</View>}
        </View>
    );


}
export default EventCalendarSingle;