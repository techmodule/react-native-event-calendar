// @flow
import {Dimensions, FlatList, Image, Text, TouchableOpacity, View, VirtualizedList} from 'react-native';
import _ from 'lodash';
import moment from 'moment';
import React from 'react';

import styleConstructor from './style';

import DayView, {NewDayView} from './DayView';
import {useIsFocused} from "@react-navigation/native";

export default class EventCalendar extends React.Component {
    static defaultProps = {
        size: 30,
        initDate: new Date(),
        formatHeader: 'DD MMMM YYYY',
    };

    constructor(props) {
        super(props);

        const start = props.start ? props.start : 0;
        const end = props.end ? props.end : 24;

        this.styles = styleConstructor(props.styles, (end - start) * 100);
        this.state = {
            date: moment(this.props.initDate),
            index: this.props.size,
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

    _getItemLayout(data, index) {
        const {width} = this.props;
        return {length: width, offset: width * index, index};
    }

    _getItem(events, index) {
        const date = moment(this.props.initDate).add(
            index - this.props.size,
            'days'
        );
        return _.filter(events, event => {
            const eventStartTime = moment(event.start);
            return (
                eventStartTime >= date.clone().startOf('day') &&
                eventStartTime <= date.clone().endOf('day')
            );
        });
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
                <DayView
                    date={date}
                    index={index}
                    format24h={format24h}
                    formatHeader={this.props.formatHeader}
                    headerStyle={this.props.headerStyle}
                    renderEvent={this.props.renderEvent}
                    eventTapped={this.props.eventTapped}
                    events={item}
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
            </View>
        );
    }
}
const DEVICE_WIDTH = Math.round(Dimensions.get('window').width);
export const EventCalendarAllDay = (props) => {
    const isFocused = useIsFocused();
    const calendarRef = React.useRef();
    const start = props.start ? props.start : 0;
    const end = props.end ? props.end : 24;
    const size = props.size ? props.size : 30;
    const initDate = initDate ? props.initDate : moment().format("YYYY-MM-DD");
    const upperCaseHeader = props.upperCaseHeader ? props.upperCaseHeader : false;
    const formatHeader = props.formatHeader ? props.formatHeader : "DD MMMM YYYY";
    const format24h = props.format24h ? props.format24h : true;
    const scrollToFirst = props.scrollToFirst ? props.scrollToFirst : true;
    const width = props.width ? props.width : DEVICE_WIDTH;
    const events = props.events ? props.events : [];
    const virtualizedListProps = props.virtualizedListProps ? props.virtualizedListProps : undefined;
    const styles = styleConstructor(props.styles, (end - start) * 100);
    const [selectedDate, setSelectedDate] = React.useState(moment(initDate));
    const [currentIndex, setCurrentIndex] = React.useState(size);
    const [isLoading, setIsLoading] = React.useState(props.isLoading ? props.isLoading : false);
    const [showMoreTopEvents, setShowMoreTopEvents] = React.useState(false);
    let isShowHeader = true;
    if (props.isShowHeader !== null && typeof props.isShowHeader !== "undefined" && props.isShowHeader === false) {
        isShowHeader = false;
    }
    const heightTopEvents = props.heightTopEvents ? props.heightTopEvents : 26;
    const sizeTopEvents = sizeTopEvents ? sizeTopEvents : 2;
    const rightIcon = props.headerIconRight ? (
        props.headerIconRight
    ) : (
        <Image source={require('./forward.png')} style={styles.arrow}/>
    );
    const rightIconSetting = props.headerIconRightSetting ? (
        props.headerIconRightSetting
    ) : (
        <Image source={require('./settings.png')} style={styles.arrow}/>
    );

    const leftIcon = props.headerIconLeft ? (
        props.headerIconLeft
    ) : (
        <Image source={require('./back.png')} style={styles.arrow}/>
    );
    const leftIconAddNew = props.leftIconAddNew ? (
        props.leftIconAddNew
    ) : (
        <Image source={require('./plus.png')} style={styles.arrow}/>
    );
    const _getItemLayout = (data, index) => {
        const {width} = props;
        return {length: width, offset: width * index, index};
    };
    const _onEventTapped = (event) => {
        props.eventTapped(event);
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
    const _makeListEventByDate = (events) => {
        let listEventByDate = [];
        for (let i = -props.size; i <= props.size; i++) {
            let date = moment(initDate).clone().add(i, 'days');
            let zeroOfDay = moment(date).startOf('day');
            let startOfDay = moment(date).startOf('day');
            if (props.start) {
                startOfDay = moment(startOfDay).add(props.start, 'hours');
            }
            let endOfDay = moment(date).endOf('day');
            if (props.end) {
                endOfDay = moment(startOfDay).add(props.end, 'hours');
            }
            let inDayEvents = _.filter(events, event => {
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
            listEventByDate.push({allDayEvents: allDayEvents, inDayEvents: inDayEvents, date: date});
        }
        return listEventByDate;
    };
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
                    key={i}
                    style={[styles.allDayEvent, style, event.color && eventColor, {marginTop: 2, marginLeft: 2}]}
                >
                    {props.renderAllDayEvent ? (
                        props.renderAllDayEvent(event)
                    ) : (
                        <View style={{margin: 2,}}>
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
                        marginTop: 2,
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
    };
    const _rightTopFunc = () => {
        //Alert.alert("_rightTopFunc", "_rightTopFunc");
        console.log("_rightTopFunc in child");
        try {
            props.rightTopFunc;
        } catch (e) {
            console.log("_rightTopFunc in child", e);
        }

    }
    const _leftTopFunc = () => {
        console.log("_leftTopFunc in child");
        try {
            props.leftTopFunc;
        } catch (e) {
            console.log("leftTopFunc in child", e);
        }


    }
    const _renderDayItem = ({item, index}) => {
        let inDayEvents = item.inDayEvents;
        let allDayEvents = item.allDayEvents;
        let topHeight = heightTopEvents * sizeTopEvents + 10;
        let fullTopHeight = heightTopEvents * allDayEvents.length;
        if (sizeTopEvents > allDayEvents.length) {
            topHeight = heightTopEvents * allDayEvents.length;
        }


        return (
            <View style={[styles.container, {width}]}>
                {allDayEvents.length > 0 &&
                <View style={{
                    height: showMoreTopEvents ? fullTopHeight : topHeight,
                    //height:300,
                    marginTop: 2,
                }}>
                    {_renderAllDayEvents(allDayEvents)}
                </View>}

                <NewDayView
                    onScrollBeginDrag={props.onScrollBeginDrag}
                    date={_date}
                    index={index}
                    format24h={format24h}
                    isLoading={isLoading}
                    formatHeader={props.formatHeader}
                    headerStyle={props.headerStyle}
                    renderEvent={props.renderEvent}
                    eventTapped={props.eventTapped}
                    events={inDayEvents}
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
        if (calendarRef !== null && calendarRef.current) {
            calendarRef.current.scrollToIndex({index, animated: false});
        }
    };
    const _goToDate = (date) => {
        const earliestDate = moment(initDate).subtract(
            size,
            'days'
        );
        const index = moment(date).diff(earliestDate, 'days');
        _goToPage(index);
    }

    const _previous = () => {
        setIsLoading(true);
        _goToPage(currentIndex - 1);
        if (props.dateChanged) {
            props.dateChanged(
                moment(initDate)
                    .add(currentIndex - 1 - formatHeader, 'days')
                    .format('YYYY-MM-DD')
            );
        }
        setIsLoading(false);
    };

    const _next = () => {
        setIsLoading(true);
        _goToPage(currentIndex + 1);
        if (props.dateChanged) {
            props.dateChanged(
                moment(initDate)
                    .add(currentIndex + 1 - formatHeader, 'days')
                    .format('YYYY-MM-DD')
            );
        }
        setIsLoading(false);

    };
    const _date = moment(selectedDate);
    let headerText = upperCaseHeader
        ? _date.format(formatHeader || 'DD MMMM YYYY').toUpperCase()
        : _date.format(formatHeader || 'DD MMMM YYYY');

    return (
        <View style={[styles.container, {width}]}>
            {isShowHeader &&
            <View style={styles.headerFlexRow}>
                <View style={styles.headersFlex2Left}>{props.leftTopView}</View>
                <TouchableOpacity
                    style={styles.headersFlex1}
                    onPress={() => _previous()}
                >
                    {leftIcon}
                </TouchableOpacity>
                <View style={styles.headersFlex6}
                >
                    <Text style={styles.headerText}>{headerText}</Text>
                </View>
                <TouchableOpacity
                    style={styles.headersFlex1}
                    onPress={() => _next()}
                >
                    {rightIcon}
                </TouchableOpacity>
                <View style={styles.headersFlex2Right}>{props.rightTopView}</View>
            </View>}
            <FlatList
                initialNumToRender={2}
                pagingEnabled
                ref={calendarRef}
                style={{width: width}}
                getItemLayout={(item, index) => _getItemLayout(item, index)}
                initialScrollIndex={currentIndex}
                data={_makeListEventByDate(events)}
                horizontal={true}
                renderItem={({item, index}) => _renderDayItem({item, index})}
                //renderItem={({item, index}) => <View style={{width:DEVICE_WIDTH}}><Text>{JSON.stringify(item)}</Text></View>}
                keyExtractor={(item, index) => index.toString()}
                onMomentumScrollEnd={event => {
                    const index = parseInt(event.nativeEvent.contentOffset.x / width);
                    const date = moment(initDate).add(
                        index - size,
                        'days'
                    );
                    if (props.dateChanged) {
                        props.dateChanged(date.format('YYYY-MM-DD'));
                    }
                    setCurrentIndex(index);
                    setSelectedDate(date);
                }}
                //extraData={selectedId}
            />

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

};
export const EventCalendarSingle = (props) => {
    const isFocused = useIsFocused();
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

    const [isLoading, setIsLoading] = React.useState(props.isLoading ? props.isLoading : false);
    const [showMoreTopEvents, setShowMoreTopEvents] = React.useState(false);
    //const isShowHeader = props.isShowHeader ? props.isShowHeader : true;
    let isShowHeader = true;
    if (props.isShowHeader !== null && typeof props.isShowHeader !== "undefined" && props.isShowHeader === false) {
        isShowHeader = false;
    }
    const heightTopEvents = props.heightTopEvents ? props.heightTopEvents : 26;
    const sizeTopEvents = sizeTopEvents ? sizeTopEvents : 2;

    const rightIcon = props.headerIconRight ? (
        props.headerIconRight
    ) : (
        <Image source={require('./forward.png')} style={styles.arrow}/>
    );
    const rightIconSetting = props.headerIconRightSetting ? (
        props.headerIconRightSetting
    ) : (
        <Image source={require('./settings.png')} style={styles.arrow}/>
    );

    const leftIcon = props.headerIconLeft ? (
        props.headerIconLeft
    ) : (
        <Image source={require('./back.png')} style={styles.arrow}/>
    );
    const leftIconAddNew = props.leftIconAddNew ? (
        props.leftIconAddNew
    ) : (
        <Image source={require('./plus.png')} style={styles.arrow}/>
    );
    const _getItemLayout = (data, index) => {
        const {width} = props;
        return {length: width, offset: width * index, index};
    };
    const _onEventTapped = (event) => {
        props.eventTapped(event);
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
                    key={i}
                    style={[styles.allDayEvent, style, event.color && eventColor, {marginTop: 2, marginLeft: 2}]}
                >
                    {props.renderAllDayEvent ? (
                        props.renderAllDayEvent(event)
                    ) : (
                        <View style={{margin: 2,}}>
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
                        marginTop: 2,
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
    };
    const _renderEventByDate = (eventListByDate, date) => {
        let inDayEvents = eventListByDate[0];
        let allDayEvents = eventListByDate[1];
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
                {isShowHeader &&
                <View style={styles.headerFlexRow}>
                    <View style={styles.headersFlex2Left}>{props.leftTopView}</View>
                    <TouchableOpacity
                        style={styles.headersFlex1}
                        onPress={() => _previous()}
                    >
                        {leftIcon}
                    </TouchableOpacity>
                    <View style={styles.headersFlex6}
                    >
                        <Text style={styles.headerText}>{headerText}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.headersFlex1}
                        onPress={() => _next()}
                    >
                        {rightIcon}
                    </TouchableOpacity>
                    <View style={styles.headersFlex2Right}>{props.rightTopView}</View>
                </View>}
                {allDayEvents.length > 0 &&
                <View style={{
                    height: showMoreTopEvents ? fullTopHeight : topHeight,
                    //height:300,
                    marginTop: 2,
                }}>
                    {_renderAllDayEvents(allDayEvents)}
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
                    allDayEvents={allDayEvents}
                    events={inDayEvents}
                    width={width}
                    styles={styles}
                    scrollToFirst={scrollToFirst}
                    start={start}
                    end={end}
                />
            </View>
        );
    };

    const _previous = () => {
        setDate(moment(date)
            .add(-1, 'days')
            .format('YYYY-MM-DD'));
        if (props.dateChanged) {
            props.dateChanged(
                moment(date)
                    .add(-1, 'days')
                    .format('YYYY-MM-DD')
            );
        }
    };

    const _next = () => {
        setDate(moment(date)
            .add(1, 'days')
            .format('YYYY-MM-DD'));
        if (props.dateChanged) {
            props.dateChanged(
                moment(date)
                    .add(1, 'days')
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