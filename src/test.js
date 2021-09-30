import moment from "moment";
import {FlatList, VirtualizedList} from "react-native";
import React from "react";
<FlatList
                data={devidedEvents}
                renderItem={({item, index}) => _renderItem({item, index})}
                keyExtractor={(item, index) => index.toString()}
                //extraData={selectedId}
            />
<VirtualizedList
                //ref={calendar}
                ref={calendarRef}
                windowSize={2}
                initialNumToRender={2}
                initialScrollIndex={size}
                data={events}
                getItemCount={() => size * 2}
                getItem={(item, index) => _getItem(item, index)}
                keyExtractor={(item, index) => index.toString()}
                getItemLayout={(item, index) => _getItemLayout(item, index)}
                renderItem={({item, index}) => _renderItem({item, index})}
                horizontal
                pagingEnabled
                style={{width: width}}
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
                {...virtualizedListProps}
            />